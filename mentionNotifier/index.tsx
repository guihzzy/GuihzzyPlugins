/*
 * Equicord, a Discord client mod
 * Copyright (c) 2026 Equicord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { HeaderBarButton } from "@api/HeaderBar";
import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelType } from "@vencord/discord-types/enums";
import {
    ChannelStore,
    GuildStore,
    IconUtils,
    SelectedChannelStore,
    UserStore
} from "@webpack/common";

import { showDMGroupNotification } from "./components/DMGroupNotification";
import { openMentionLogsModal } from "./components/MentionLogsModal";
import { addMentionLog } from "./logs";

const settings = definePluginSettings({
    notifyOnMention: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Notificar quando alguém te mencionar diretamente em Grupos (DMs de Grupo)"
    },
    notifyOnGuildMention: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Notificar quando alguém te mencionar diretamente em Servidores"
    },
    notifyOnEveryone: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Notificar em menções de @everyone e @here (em Grupos e Servidores)"
    },
    showInActive: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Mostrar notificações mesmo para o canal ativo no momento"
    },
    showLogsButton: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Exibir botão de 'Histórico de Menções' na barra superior do chat"
    }
});

function MentionLogHeaderIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
        </svg>
    );
}

function MentionLogsToolbarButton() {
    if (!settings.store.showLogsButton) return null;

    return (
        <HeaderBarButton
            onClick={() => openMentionLogsModal()}
            tooltip="Histórico de Menções (MentionNotifier)"
            icon={MentionLogHeaderIcon}
        />
    );
}

export default definePlugin({
    name: "MentionNotifier",
    description: "Notifica você quando for mencionado/marcado em Grupos e Servidores, com histórico detalhado de logs.",
    tags: ["Chat", "Notifications"],
    authors: [EquicordDevs.nyx],
    settings,

    headerBarButton: MentionLogsToolbarButton,

    flux: {
        MESSAGE_CREATE({ message }: { message: any }) {
            try {
                if (!message?.channel_id || message.state === "SENDING") return;

                const channel = ChannelStore.getChannel(message.channel_id);
                const currentUser = UserStore.getCurrentUser();

                if (!channel || !currentUser) return;
                if (message.author?.id === currentUser.id) return;

                const isGroupDM = channel.type === ChannelType.GROUP_DM;
                const isGuildChannel = Boolean(channel.guild_id);

                // Apenas processa se for Group DM ou canal de servidor
                if (!isGroupDM && !isGuildChannel) return;

                // Checa condição do canal ativo
                if (!settings.store.showInActive && channel.id === SelectedChannelStore.getChannelId()) return;

                const isDirect = Boolean(message.mentions?.some((u: any) => u.id === currentUser.id));
                const isEveryone = Boolean(message.mention_everyone);

                let shouldNotify = false;

                if (isGroupDM) {
                    if (settings.store.notifyOnMention && isDirect) shouldNotify = true;
                    if (settings.store.notifyOnEveryone && isEveryone) shouldNotify = true;
                } else if (isGuildChannel) {
                    if (settings.store.notifyOnGuildMention && isDirect) shouldNotify = true;
                    if (settings.store.notifyOnEveryone && isEveryone) shouldNotify = true;
                }

                if (shouldNotify) {
                    const guild = isGuildChannel ? GuildStore.getGuild(channel.guild_id) : null;
                    const author = UserStore.getUser(message.author.id) || { username: message.author.username || "Desconhecido" };
                    const authorName = author.username || message.author.username || "Desconhecido";
                    const authorGlobalName = author.globalName ?? message.author.global_name ?? null;
                    const authorAvatar = author.getAvatarURL?.(undefined, 64) || message.author.avatarURL || IconUtils.getDefaultAvatarURL(message.author.id);

                    // Adiciona ao sistema de log
                    addMentionLog({
                        messageId: message.id,
                        channelId: channel.id,
                        guildId: channel.guild_id ?? null,
                        channelName: channel.name || (isGroupDM ? "Grupo" : "canal"),
                        guildName: guild?.name ?? null,
                        authorId: message.author.id,
                        authorName,
                        authorGlobalName,
                        authorAvatar,
                        content: message.content || "",
                        isGroupDM,
                        isEveryone,
                        isDirect
                    });

                    // Mostra o card popup
                    showDMGroupNotification(message, channel, guild);
                }
            } catch (err) {
                console.error("[DMGroupsNotification] Error:", err);
            }
        }
    }
});
