/*
 * Equicord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Channel, Message, RenderModalProps } from "@vencord/discord-types";
import {
    ChannelStore,
    createRoot,
    Menu,
    openModal,
    React,
    SelectedChannelStore
} from "@webpack/common";
import type { Root } from "react-dom/client";

import { FloatingActionBar } from "./components/FloatingActionBar";
import { ForwardModal } from "./components/ForwardModal";
import { MessageSelectionIndicator } from "./components/MessageSelectionIndicator";
import { multiForwardStore } from "./store";
import { ForwardOrder } from "./types";

export function ForwardIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M10 3a1 1 0 0 1 .7.3l9 9a1 1 0 0 1 0 1.4l-9 9A1 1 0 0 1 9 22V16.94C4.16 17.38 2.11 20.37 2.05 20.47a1 1 0 0 1-1.74-.9C1.19 13.9 4.3 9.4 9 9.06V4a1 1 0 0 1 1-1Z" />
        </svg>
    );
}

const settings = definePluginSettings({
    replaceDefaultForward: {
        type: OptionType.BOOLEAN,
        description: "Ao clicar no botão nativo de 'Encaminhar', iniciar o modo de seleção múltipla (segure Shift para o encaminhamento padrão de uma única mensagem).",
        default: true
    },
    defaultOrder: {
        type: OptionType.SELECT,
        description: "Ordem padrão ao enviar as mensagens encaminhadas.",
        options: [
            { label: "Ordem Cronológica (como apareceram no chat)", value: "chronological", default: true },
            { label: "Ordem de Seleção (conforme a ordem em que você clicou)", value: "selection" }
        ]
    },
    delayBetweenMessages: {
        type: OptionType.SLIDER,
        description: "Intervalo em milissegundos entre o envio de cada mensagem (evita rate limits do Discord e mantém a ordem perfeita).",
        markers: [100, 200, 250, 500, 1000],
        default: 250
    },
    showPopoverButton: {
        type: OptionType.BOOLEAN,
        description: "Exibir botão de 'Encaminhar Várias' na barra de ferramentas flutuante ao passar o mouse sobre as mensagens.",
        default: true
    }
});

let rootContainer: Root | null = null;
let domContainer: HTMLDivElement | null = null;

function setupFloatingBar() {
    if (!rootContainer) {
        domContainer = document.createElement("div");
        domContainer.id = "vc-multiforward-root";
        document.body.appendChild(domContainer);
        rootContainer = createRoot(domContainer);
        rootContainer.render(<FloatingActionBar />);
    }
}

function removeFloatingBar() {
    if (rootContainer) {
        rootContainer.unmount();
        rootContainer = null;
    }
    if (domContainer && domContainer.parentNode) {
        domContainer.parentNode.removeChild(domContainer);
        domContainer = null;
    }
}

function openForwardModalDialog() {
    openModal((modalProps: RenderModalProps) => (
        <ForwardModal
            modalProps={modalProps}
            delayMs={settings.store.delayBetweenMessages}
        />
    ));
}

function handleKeyDown(e: KeyboardEvent) {
    if (!multiForwardStore.getIsSelecting()) return;

    if (e.key === "Escape") {
        e.preventDefault();
        multiForwardStore.cancelSelection();
    } else if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        // Se estiver selecionando mensagens e o usuário pressionar Enter (fora de inputs)
        const target = e.target as HTMLElement;
        if (target && !["INPUT", "TEXTAREA"].includes(target.tagName)) {
            const count = multiForwardStore.getSnapshot().selectedCount;
            if (count > 0) {
                e.preventDefault();
                openForwardModalDialog();
            }
        }
    }
}

function handleChannelChange() {
    if (!multiForwardStore.getIsSelecting()) return;
    const currentChannelId = SelectedChannelStore.getChannelId();
    if (currentChannelId && currentChannelId !== multiForwardStore.getActiveChannelId()) {
        multiForwardStore.cancelSelection();
    }
}

function findForwardMenuItem(children: any[]): any {
    if (!Array.isArray(children)) return null;
    for (const child of children) {
        if (!child) continue;
        const id = child.props?.id;
        if (id === "forward" || id === "message-forward") {
            return child;
        }
        if (Array.isArray(child.props?.children)) {
            const found = findForwardMenuItem(child.props.children);
            if (found) return found;
        }
    }
    return null;
}

function SettingsBanner() {
    return (
        <div className="vc-multiforward-settings-banner">
            <div className="vc-multiforward-settings-icon-box">
                <ForwardIcon width={24} height={24} />
            </div>
            <div>
                <div className="vc-multiforward-settings-title">MultiForward (Encaminhar Várias)</div>
                <div className="vc-multiforward-settings-subtitle">
                    Selecione múltiplas mensagens no chat e encaminhe todas juntas para canais ou amigos de uma só vez.
                </div>
            </div>
        </div>
    );
}

export default definePlugin({
    name: "MultiForward",
    description: "Permite selecionar múltiplas mensagens e encaminhá-las todas de uma vez para qualquer canal ou amigo.",
    tags: ["Chat", "Utility"],
    authors: [Devs.Ven],
    dependencies: ["MessagePopoverAPI", "MessageDecorationsAPI", "MessageEventsAPI"],
    settings,

    settingsAboutComponent: () => <SettingsBanner />,

    start() {
        multiForwardStore.setOrder(settings.store.defaultOrder as ForwardOrder);
        multiForwardStore.openModalFn = openForwardModalDialog;

        setupFloatingBar();

        document.addEventListener("keydown", handleKeyDown);
        SelectedChannelStore.addChangeListener(handleChannelChange);
    },

    stop() {
        document.removeEventListener("keydown", handleKeyDown);
        SelectedChannelStore.removeChangeListener(handleChannelChange);

        removeFloatingBar();
        multiForwardStore.cancelSelection();
        multiForwardStore.openModalFn = null;
    },

    contextMenus: {
        "message"(children, props: { message: Message; channel: Channel; }) {
            const { message, channel } = props;
            if (!message || !channel) return;

            // Se a opção de substituir o encaminhar padrão estiver ativa, intercepta o botão nativo
            if (settings.store.replaceDefaultForward) {
                const nativeItem = findForwardMenuItem(children);
                if (nativeItem && nativeItem.props) {
                    const originalAction = nativeItem.props.action;
                    nativeItem.props.action = (e: any) => {
                        if (e?.shiftKey) {
                            originalAction?.(e);
                        } else {
                            multiForwardStore.startSelection(message, channel.id);
                        }
                    };
                }
            }

            const isSelecting = multiForwardStore.getIsSelecting();
            const isSelected = multiForwardStore.isSelected(message.id);
            const count = multiForwardStore.getSnapshot().selectedCount;

            children.push(
                <Menu.MenuGroup key="vc-multiforward-group">
                    {!isSelecting ? (
                        <Menu.MenuItem
                            id="vc-multiforward-start"
                            label="Encaminhar Várias Mensagens..."
                            icon={ForwardIcon}
                            action={() => multiForwardStore.startSelection(message, channel.id)}
                        />
                    ) : (
                        <>
                            <Menu.MenuItem
                                id="vc-multiforward-toggle"
                                label={isSelected ? "Desmarcar para Encaminhar" : "Selecionar para Encaminhar"}
                                icon={ForwardIcon}
                                action={() => multiForwardStore.toggleMessage(message)}
                            />
                            {count > 0 && (
                                <Menu.MenuItem
                                    id="vc-multiforward-send-all"
                                    label={`Encaminhar ${count} Mensagen${count > 1 ? "s" : ""} Selecionada${count > 1 ? "s" : ""}`}
                                    icon={ForwardIcon}
                                    action={() => openForwardModalDialog()}
                                />
                            )}
                            <Menu.MenuItem
                                id="vc-multiforward-cancel"
                                label="Cancelar Seleção (Esc)"
                                color="danger"
                                action={() => multiForwardStore.cancelSelection()}
                            />
                        </>
                    )}
                </Menu.MenuGroup>
            );
        }
    },

    messagePopoverButton: {
        icon: ForwardIcon,
        render(message: Message) {
            if (!settings.store.showPopoverButton) return null;

            const isSelected = multiForwardStore.isSelected(message.id);
            const isSelecting = multiForwardStore.getIsSelecting();

            const channel = ChannelStore.getChannel(message.channel_id);
            if (!channel) return null;

            return {
                label: isSelecting
                    ? (isSelected ? "Desmarcar Mensagem" : "Selecionar para Encaminhar")
                    : "Encaminhar Várias",
                icon: ForwardIcon,
                message,
                channel,
                onClick: () => {
                    multiForwardStore.toggleMessage(message);
                }
            };
        }
    },

    onMessageClick(msg: Message, channel: Channel, event: MouseEvent) {
        if (!multiForwardStore.getIsSelecting()) return;

        // Se o usuário clicar em uma mensagem de outro canal, cancela
        if (multiForwardStore.getActiveChannelId() && multiForwardStore.getActiveChannelId() !== channel.id) {
            return;
        }

        const target = event.target as HTMLElement | null;
        if (!target) return;

        // Ignora cliques dentro de botões interativos, links, imagens ou a própria barra flutuante
        if (target.closest("a, button, [role='button'], input, textarea, .vc-multiforward-floating-bar, .vc-multiforward-modal-container")) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        multiForwardStore.toggleMessage(msg);
    },

    renderMessageDecoration({ message }: { message: Message; }) {
        return <MessageSelectionIndicator message={message} />;
    }
});
