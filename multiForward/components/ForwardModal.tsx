/*
 * Equicord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getUserAvatarUrl } from "@utils/misc";
import { Channel, Message, RenderModalProps, User } from "@vencord/discord-types";
import {
    Button,
    ChannelStore,
    Checkbox,
    GuildStore,
    IconUtils,
    Modal,
    PermissionsBits,
    PermissionStore,
    PrivateChannelSortStore,
    React,
    TextArea,
    TextInput,
    UserStore
} from "@webpack/common";

import { forwardMessages, ForwardProgress } from "../forwarder";
import { multiForwardStore, useMultiForwardStore } from "../store";
import { DestinationItem } from "../types";

export function ForwardModal({
    modalProps,
    delayMs = 250
}: {
    modalProps: RenderModalProps;
    delayMs?: number;
}) {
    const { orderedMessages, cancelSelection } = useMultiForwardStore();
    const [messages, setMessages] = React.useState<Message[]>(orderedMessages);
    const [search, setSearch] = React.useState("");
    const [note, setNote] = React.useState("");
    const [selectedChannels, setSelectedChannels] = React.useState<Set<string>>(new Set());
    const [isSending, setIsSending] = React.useState(false);
    const [progress, setProgress] = React.useState<ForwardProgress | null>(null);

    // Constrói lista de destinos (DMs recentes e canais onde pode falar)
    const destinations = React.useMemo(() => {
        const items: DestinationItem[] = [];
        const seen = new Set<string>();

        // 1. DMs e Grupos Recentes
        try {
            const privateIds: string[] = PrivateChannelSortStore?.getPrivateChannelIds?.() || [];
            for (const id of privateIds) {
                if (seen.has(id)) continue;
                const channel = ChannelStore.getChannel(id);
                if (!channel) continue;

                if (channel.isDM()) {
                    const recipientId = channel.getRecipientId?.() || channel.recipients?.[0];
                    const user = recipientId ? UserStore.getUser(recipientId) : null;
                    const name = user?.globalName || user?.username || "Usuário";
                    const avatarUrl = user ? getUserAvatarUrl(user, undefined, true, 32) : undefined;

                    items.push({
                        id: channel.id,
                        name,
                        isDM: true,
                        isGroupDM: false,
                        isGuild: false,
                        iconUrl: avatarUrl,
                        channel,
                        user: user || undefined
                    });
                    seen.add(id);
                } else if (channel.isGroupDM()) {
                    const name = channel.name || "Grupo com " + channel.recipients?.length + " pessoas";
                    const iconUrl = IconUtils.getChannelIconURL?.({ ...channel, applicationId: channel.getApplicationId?.(), size: 32 });

                    items.push({
                        id: channel.id,
                        name,
                        isDM: false,
                        isGroupDM: true,
                        isGuild: false,
                        iconUrl,
                        channel
                    });
                    seen.add(id);
                }
            }
        } catch (e) {
            console.warn("[MultiForward] Erro ao carregar DMs:", e);
        }

        // 2. Canais de Servidores com permissão de envio
        try {
            const guilds = GuildStore.getGuilds();
            for (const guildId in guilds) {
                const guild = guilds[guildId];
                if (!guild) continue;

                const channels = ChannelStore.getChannels(guildId);
                const textChannels = (channels?.VOCAL || []).concat(channels?.SELECTABLE || []);
                for (const cat of textChannels) {
                    const channel = cat?.channel || cat;
                    if (!channel || channel.type === 4 || channel.type === 2) continue; // ignora categorias e canais de voz
                    if (seen.has(channel.id)) continue;

                    const canSend = PermissionStore.can(PermissionsBits.SEND_MESSAGES, channel);
                    if (!canSend) continue;

                    const guildIconUrl = IconUtils.getGuildIconURL?.({ id: guild.id, icon: guild.icon, canAnimate: false, size: 24 });

                    items.push({
                        id: channel.id,
                        name: `#${channel.name}`,
                        isDM: false,
                        isGroupDM: false,
                        isGuild: true,
                        guildId: guild.id,
                        guildName: guild.name,
                        iconUrl: guildIconUrl,
                        channel
                    });
                    seen.add(channel.id);
                }
            }
        } catch (e) {
            console.warn("[MultiForward] Erro ao carregar canais de guild:", e);
        }

        return items;
    }, []);

    // Filtra destinos conforme a busca
    const filteredDestinations = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return destinations.slice(0, 30); // Mostra os 30 mais recentes
        return destinations.filter(d => {
            const nameMatch = d.name.toLowerCase().includes(query);
            const guildMatch = d.guildName?.toLowerCase().includes(query);
            const userTagMatch = d.user?.username?.toLowerCase().includes(query);
            return nameMatch || guildMatch || userTagMatch;
        }).slice(0, 50);
    }, [destinations, search]);

    const toggleChannel = (channelId: string) => {
        setSelectedChannels(prev => {
            const next = new Set(prev);
            if (next.has(channelId)) next.delete(channelId);
            else next.add(channelId);
            return next;
        });
    };

    const handleRemoveMessage = (msgId: string) => {
        const next = messages.filter(m => m.id !== msgId);
        setMessages(next);
        multiForwardStore.deselectMessage(msgId);
        if (next.length === 0) {
            modalProps.onClose();
        }
    };

    const handleSend = async () => {
        if (!messages.length || !selectedChannels.size || isSending) return;

        setIsSending(true);
        const channelIds = Array.from(selectedChannels);

        try {
            await forwardMessages(messages, channelIds, note, delayMs, prog => {
                setProgress(prog);
            });
            cancelSelection();
            modalProps.onClose();
        } catch (err) {
            console.error("[MultiForward] Erro ao encaminhar:", err);
        } finally {
            setIsSending(false);
            setProgress(null);
        }
    };

    const totalSelected = selectedChannels.size;

    return (
        <Modal
            {...modalProps}
            size="md"
            title={`Encaminhar ${messages.length} Mensagen${messages.length > 1 ? "s" : ""}`}
            actions={[
                {
                    text: isSending ? (progress ? `Enviando ${progress.current}/${progress.total}...` : "Enviando...") : `Encaminhar para ${totalSelected || ""} destino${totalSelected > 1 ? "s" : ""}`,
                    variant: "primary",
                    disabled: isSending || totalSelected === 0 || messages.length === 0,
                    onClick: handleSend
                },
                {
                    text: "Cancelar",
                    disabled: isSending,
                    onClick: modalProps.onClose
                }
            ]}
        >
            <div className="vc-multiforward-modal-container">
                {/* Resumo das mensagens selecionadas com miniaturas */}
                <div className="vc-multiforward-preview-header">
                    <span className="vc-multiforward-preview-title">
                        Mensagens a serem encaminhadas ({messages.length}):
                    </span>
                </div>

                <div className="vc-multiforward-preview-list">
                    {messages.map((msg, index) => {
                        const avatar = msg.author ? getUserAvatarUrl(msg.author, undefined, true, 20) : "";
                        const textPreview = msg.content ? (msg.content.length > 80 ? msg.content.slice(0, 80) + "..." : msg.content) : (msg.attachments?.length ? `[${msg.attachments.length} anexo(s)]` : "[Mensagem]");

                        return (
                            <div key={msg.id} className="vc-multiforward-preview-card">
                                <span className="vc-multiforward-preview-index">#{index + 1}</span>
                                {avatar && <img src={avatar} className="vc-multiforward-preview-avatar" alt="" />}
                                <div className="vc-multiforward-preview-content">
                                    <span className="vc-multiforward-preview-author">{msg.author?.username || "Usuário"}</span>
                                    <span className="vc-multiforward-preview-text">{textPreview}</span>
                                </div>
                                <button
                                    className="vc-multiforward-preview-remove"
                                    onClick={() => handleRemoveMessage(msg.id)}
                                    title="Remover esta mensagem"
                                    disabled={isSending}
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Campo de comentário / nota complementar opcional */}
                <div className="vc-multiforward-note-container">
                    <TextArea
                        placeholder="Adicionar um comentário ou mensagem opcional..."
                        value={note}
                        onChange={(val: string) => setNote(val)}
                        disabled={isSending}
                        rows={2}
                    />
                </div>

                {/* Barra de busca de destinatários */}
                <div className="vc-multiforward-search-container">
                    <TextInput
                        placeholder="Pesquisar amigos, canais ou servidores..."
                        value={search}
                        onChange={(val: string) => setSearch(val)}
                        disabled={isSending}
                        autoFocus
                    />
                </div>

                {/* Lista de destinos */}
                <div className="vc-multiforward-destinations-list">
                    {filteredDestinations.length === 0 ? (
                        <div className="vc-multiforward-empty">
                            Nenhum canal ou amigo encontrado com "{search}".
                        </div>
                    ) : (
                        filteredDestinations.map(dest => {
                            const isChecked = selectedChannels.has(dest.id);
                            return (
                                <div
                                    key={dest.id}
                                    className={`vc-multiforward-dest-item ${isChecked ? "active" : ""}`}
                                    onClick={() => !isSending && toggleChannel(dest.id)}
                                >
                                    <div className="vc-multiforward-dest-icon-box">
                                        {dest.iconUrl ? (
                                            <img
                                                src={dest.iconUrl}
                                                className={`vc-multiforward-dest-icon ${dest.isDM ? "round" : ""}`}
                                                alt=""
                                            />
                                        ) : (
                                            <span className="vc-multiforward-dest-hash">#</span>
                                        )}
                                    </div>

                                    <div className="vc-multiforward-dest-info">
                                        <div className="vc-multiforward-dest-name-row">
                                            <span className="vc-multiforward-dest-name">{dest.name}</span>
                                            {dest.guildName && (
                                                <span className="vc-multiforward-dest-guild">{dest.guildName}</span>
                                            )}
                                        </div>
                                        <span className="vc-multiforward-dest-sub">
                                            {dest.isDM ? "Mensagem Direta" : dest.isGroupDM ? "Grupo" : "Canal de Texto"}
                                        </span>
                                    </div>

                                    <Checkbox
                                        value={isChecked}
                                        onChange={() => toggleChannel(dest.id)}
                                        size={20}
                                        disabled={isSending}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Barra de progresso se estiver enviando */}
                {isSending && progress && (
                    <div className="vc-multiforward-progress-bar-container">
                        <div
                            className="vc-multiforward-progress-bar-fill"
                            style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                        />
                        <span className="vc-multiforward-progress-text">
                            Encaminhando {progress.current} de {progress.total}...
                        </span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
