/*
 * Equicord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";
import managedStyle from "./style.css?managed";

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Channel, Message, RenderModalProps } from "@vencord/discord-types";
import {
    ChannelStore,
    createRoot,
    Menu,
    MessageStore,
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
let storeUnsubscribe: (() => void) | null = null;

/**
 * Aplica/remove a classe `.vc-multiforward-msg-selected` e o atributo
 * `data-mf-index` diretamente nos elementos `<li>` de cada mensagem.
 *
 * Necessário porque `renderMessageDecoration` só é chamado pelo Discord
 * para a primeira mensagem de cada grupo visual — as agrupadas não recebem
 * o componente React, então precisamos do DOM para mostrar o indicador.
 */
function syncHighlights() {
    // Remove todos os destaques anteriores
    document.querySelectorAll(".vc-multiforward-msg-selected").forEach(el => {
        el.classList.remove("vc-multiforward-msg-selected");
        el.removeAttribute("data-mf-index");
    });

    if (!multiForwardStore.getIsSelecting()) return;

    const ordered = multiForwardStore.getOrderedMessages();
    ordered.forEach((msg, i) => {
        // O Discord sempre renderiza id="message-content-<messageId>" em cada mensagem,
        // inclusive nas agrupadas — subir até o <li> garante que aplicamos no container correto.
        const contentEl = document.getElementById("message-content-" + msg.id);
        const li = contentEl?.closest<HTMLElement>("li");
        if (li) {
            li.classList.add("vc-multiforward-msg-selected");
            li.setAttribute("data-mf-index", String(i + 1));
        }
    });
}

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

/**
 * Extrai o messageId do elemento DOM clicado.
 *
 * O Discord usa estas convenções de id:
 *  - `id="message-content-<messageId>"` no div de conteúdo de CADA mensagem (inclusive agrupadas)
 *  - `id="message-accessories-<messageId>"` nos anexos/embeds de cada mensagem
 *  - `id="chat-messages-<channelId>-<messageId>"` no `<li>` container (apenas da primeira do grupo)
 *
 * Prioriza `message-content-` porque funciona para TODAS as mensagens do grupo.
 */
function getMessageIdFromClick(target: HTMLElement): string | null {
    // 1. Conteúdo individual da mensagem (funciona em mensagens agrupadas)
    const contentEl = target.closest<HTMLElement>('[id^="message-content-"]');
    if (contentEl) {
        const id = contentEl.id.replace("message-content-", "");
        if (/^\d{17,20}$/.test(id)) return id;
    }

    // 2. Acessórios da mensagem (anexos, embeds)
    const accEl = target.closest<HTMLElement>('[id^="message-accessories-"]');
    if (accEl) {
        const id = accEl.id.replace("message-accessories-", "");
        if (/^\d{17,20}$/.test(id)) return id;
    }

    // 3. Fallback: container <li> da mensagem
    const messageLi = target.closest<HTMLElement>('[id*="chat-messages-"], [id*="chat-messages___"], [data-list-item-id*="chat-messages"]');
    if (messageLi) {
        const idAttr = messageLi.id || messageLi.getAttribute("data-list-item-id") || "";
        const numbers = idAttr.match(/\d{17,20}/g);
        if (numbers && numbers.length >= 2) return numbers[1]; // segundo número = messageId
        if (numbers && numbers.length === 1) return numbers[0];
    }

    return null;
}

function handleDomClick(e: MouseEvent) {
    if (!multiForwardStore.getIsSelecting()) return;

    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Ignora cliques em elementos interativos ou nossos overlays
    if (target.closest("a, button, [role='button'], input, textarea, select, .vc-multiforward-floating-bar, .vc-multiforward-modal-container")) {
        return;
    }

    const messageId = getMessageIdFromClick(target);
    if (!messageId) return;

    const channelId = SelectedChannelStore.getChannelId();
    if (!channelId) return;

    const activeChannelId = multiForwardStore.getActiveChannelId();
    if (activeChannelId && activeChannelId !== channelId) return;

    const message = MessageStore.getMessage(channelId, messageId);
    if (!message) return;

    const channel = ChannelStore.getChannel(channelId);
    if (!channel) return;

    e.preventDefault();
    e.stopPropagation();
    multiForwardStore.toggleMessage(message);
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
    dependencies: ["MessagePopoverAPI", "MessageDecorationsAPI"],
    settings,
    managedStyle,

    settingsAboutComponent: () => <SettingsBanner />,

    start() {
        multiForwardStore.setOrder(settings.store.defaultOrder as ForwardOrder);
        multiForwardStore.openModalFn = openForwardModalDialog;

        setupFloatingBar();

        // Sincroniza destaques visuais no DOM a cada mudança do store
        storeUnsubscribe = multiForwardStore.subscribe(syncHighlights);

        document.addEventListener("keydown", handleKeyDown);
        // Usa captura (true) para interceptar antes dos handlers do Discord
        document.addEventListener("click", handleDomClick, true);
        SelectedChannelStore.addChangeListener(handleChannelChange);
    },

    stop() {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("click", handleDomClick, true);
        SelectedChannelStore.removeChangeListener(handleChannelChange);

        storeUnsubscribe?.();
        storeUnsubscribe = null;

        // Limpa todos os destaques DOM ao desativar
        document.querySelectorAll(".vc-multiforward-msg-selected").forEach(el => {
            el.classList.remove("vc-multiforward-msg-selected");
            el.removeAttribute("data-mf-index");
        });

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

    renderMessageDecoration({ message }: { message: Message; }) {
        return <MessageSelectionIndicator message={message} />;
    }
});
