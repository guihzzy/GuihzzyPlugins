/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { Notice } from "@components/Notice";
import definePlugin, { OptionType } from "@utils/types";
import { Channel, User, VoiceState } from "@vencord/discord-types";
import { ChannelType } from "@vencord/discord-types/enums";
import { ChannelActions, ChannelStore, Menu, React, SelectedChannelStore, showToast, Toasts, UserStore, VoiceStateStore } from "@webpack/common";

const lastUserChannels = new Map<string, string>();
let lastMyChannelId: string | null = null;
let lastMyChannelTime = 0;

let pendingTransferTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingTransferChannelId: string | null = null;
let pendingTransferUserId: string | null = null;

function clearPendingTransfer() {
    if (pendingTransferTimeout) {
        clearTimeout(pendingTransferTimeout);
        pendingTransferTimeout = null;
    }
    pendingTransferChannelId = null;
    pendingTransferUserId = null;
}

const settings = definePluginSettings({
    transferDelay: {
        type: OptionType.SLIDER,
        description: "Tempo de espera antes de transferir a chamada para o PC (em segundos). Defina como 0 para ser instantâneo.",
        markers: [0, 1, 2, 3, 5, 10, 15, 20, 30, 60],
        default: 0,
        stickToMarkers: false,
        componentProps: {
            onValueRender: (v: number) => {
                const rounded = Math.round(v);
                return rounded === 0 ? "Instantâneo (0s)" : `${rounded}s`;
            }
        }
    },
    notifyOnTransfer: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Exibir notificação quando a chamada for transferida para o PC."
    },
    onlyDms: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Apenas transferir chamadas de DMs e Grupos (ignorar canais de servidores)."
    }
}).withPrivateSettings<{
    monitoredUsers?: string[];
}>();

function isDmOrGroupDm(channel: Channel | undefined): boolean {
    if (!channel) return true;
    if (channel.guild_id) return false;
    return (
        (typeof channel.isDM === "function" && channel.isDM()) ||
        (typeof channel.isGroupDM === "function" && channel.isGroupDM()) ||
        (typeof channel.isMultiUserDM === "function" && channel.isMultiUserDM()) ||
        channel.type === ChannelType.DM ||
        channel.type === ChannelType.GROUP_DM
    );
}

const UserContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: { user?: User; }) => {
    const myId = UserStore.getCurrentUser()?.id;
    if (!user?.id || user.id === myId) return;

    const monitoredUsers = settings.store.monitoredUsers ?? [];
    const [checked, setChecked] = React.useState(monitoredUsers.includes(user.id));

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuCheckboxItem
            id="vc-call-keeper-user"
            label="CallKeeper"
            checked={checked}
            action={() => {
                const current = settings.store.monitoredUsers ?? [];
                if (current.includes(user.id)) {
                    settings.store.monitoredUsers = current.filter(id => id !== user.id);
                    setChecked(false);
                } else {
                    settings.store.monitoredUsers = [...current, user.id];
                    setChecked(true);
                    const vs = VoiceStateStore.getVoiceStateForUser(user.id);
                    if (vs?.channelId) {
                        lastUserChannels.set(user.id, vs.channelId);
                    }
                }
            }}
        />
    );
};

export default definePlugin({
    name: "CallKeeper",
    description: "Transfere automaticamente a chamada do celular para o PC quando o usuário monitorado sair de uma DM ou Group DM.",
    tags: ["Voice", "Utility"],
    authors: [],
    settings,
    settingsAboutComponent: () => (
        <Notice.Info>
            Clique com o botão direito em um usuário para ativar ou desativar o <b>CallKeeper</b>.
            Enquanto você estiver em uma DM ou Group DM pelo celular com essa pessoa, quando ela sair da chamada,
            sua conexão será automaticamente transferida para o PC.
        </Notice.Info>
    ),
    contextMenus: {
        "user-context": UserContextMenuPatch
    },
    flux: {
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            const myId = UserStore.getCurrentUser()?.id;
            if (!myId) return;

            const monitoredUsers = settings.store.monitoredUsers ?? [];
            const previousMyChannelId = lastMyChannelId;
            const previousMyChannelTime = lastMyChannelTime;

            // Primeiro: Atualiza o estado da própria conta
            for (const voiceState of voiceStates) {
                if (voiceState.userId === myId) {
                    if (voiceState.channelId) {
                        lastMyChannelId = voiceState.channelId;
                        lastMyChannelTime = Date.now();
                        lastUserChannels.set(myId, voiceState.channelId);

                        // Se a conta já estiver conectada em voz pelo PC, cancela transferência pendente
                        if (SelectedChannelStore.getVoiceChannelId()) {
                            clearPendingTransfer();
                        }
                    } else {
                        lastUserChannels.delete(myId);
                        lastMyChannelTime = Date.now();
                    }
                }
            }

            // Segundo: Verifica eventos de saída dos usuários monitorados
            for (const voiceState of voiceStates) {
                const { userId, channelId } = voiceState;

                // Ignora se for a própria conta
                if (userId === myId) continue;

                // Se o usuário monitorado retornou à chamada enquanto havia uma transferência pendente, cancela a espera
                if (pendingTransferUserId === userId && pendingTransferChannelId === channelId) {
                    clearPendingTransfer();
                }

                const oldChannelId = voiceState.oldChannelId ?? lastUserChannels.get(userId) ?? VoiceStateStore.getVoiceStateForUser(userId)?.channelId;

                // Atualiza o mapa de canais
                if (channelId) {
                    lastUserChannels.set(userId, channelId);
                } else {
                    lastUserChannels.delete(userId);
                }

                // Apenas monitora se o CallKeeper estiver ativado para essa pessoa
                if (!monitoredUsers.includes(userId)) continue;

                // Detecta se a outra pessoa saiu da chamada
                const leftChannelId = (oldChannelId && !channelId)
                    ? oldChannelId
                    : (oldChannelId && channelId && oldChannelId !== channelId ? oldChannelId : null);

                if (!leftChannelId) continue;

                // Validação: Verificar se é DM/Grupo se configurado
                if (settings.store.onlyDms) {
                    const channel = ChannelStore.getChannel(leftChannelId);
                    if (!isDmOrGroupDm(channel)) continue;
                }

                // Validação: Eu estava na mesma chamada (no mobile ou outro client)
                const currentMyVoiceState = VoiceStateStore.getVoiceStateForUser(myId);
                const wasInSameCall =
                    currentMyVoiceState?.channelId === leftChannelId ||
                    previousMyChannelId === leftChannelId ||
                    lastMyChannelId === leftChannelId ||
                    (Date.now() - previousMyChannelTime < 20000 && previousMyChannelId === leftChannelId);

                if (!wasInSameCall) continue;

                // Validação: Se você já estiver conectado em chamada pelo PC, não faz nada
                const pcVoiceChannelId = SelectedChannelStore.getVoiceChannelId();
                if (pcVoiceChannelId) continue;

                // Cancela qualquer transferência pendente anterior antes de agendar a nova
                clearPendingTransfer();

                const delaySeconds = Math.max(0, Math.round(settings.store.transferDelay ?? 0));
                const delayMs = delaySeconds === 0 ? 100 : delaySeconds * 1000;

                pendingTransferChannelId = leftChannelId;
                pendingTransferUserId = userId;

                // Todas as condições atendidas: aguarda o tempo configurado (ou instantâneo) antes de transferir
                pendingTransferTimeout = setTimeout(() => {
                    clearPendingTransfer();

                    // Validação: Se o PC já estiver em uma chamada de voz, não transfere
                    const currentPcVoice = SelectedChannelStore.getVoiceChannelId();
                    if (currentPcVoice) return;

                    // Validação: Se o usuário monitorado retornou à chamada durante o tempo de espera, cancela
                    const currentMonitoredVs = VoiceStateStore.getVoiceStateForUser(userId);
                    if (currentMonitoredVs?.channelId === leftChannelId) return;

                    ChannelActions.selectVoiceChannel(leftChannelId);

                    if (settings.store.notifyOnTransfer) {
                        showToast("CallKeeper: Chamada transferida para o PC.", Toasts.Type.SUCCESS);
                    }
                }, delayMs);
            }
        }
    },
    start() {
        clearPendingTransfer();
        lastUserChannels.clear();
        lastMyChannelId = null;
        lastMyChannelTime = 0;

        const myId = UserStore.getCurrentUser()?.id;
        if (myId) {
            const myState = VoiceStateStore.getVoiceStateForUser(myId);
            if (myState?.channelId) {
                lastMyChannelId = myState.channelId;
                lastMyChannelTime = Date.now();
                lastUserChannels.set(myId, myState.channelId);
            }
        }

        try {
            const allStates = VoiceStateStore.getAllVoiceStates?.();
            if (allStates) {
                for (const guildId in allStates) {
                    const guildStates = allStates[guildId];
                    for (const uId in guildStates) {
                        const vs = guildStates[uId];
                        if (vs?.channelId) {
                            lastUserChannels.set(uId, vs.channelId);
                        }
                    }
                }
            }
        } catch {
            // Ignora se não suportado
        }

        const monitoredUsers = settings.store.monitoredUsers ?? [];
        for (const userId of monitoredUsers) {
            const vs = VoiceStateStore.getVoiceStateForUser(userId);
            if (vs?.channelId) {
                lastUserChannels.set(userId, vs.channelId);
            }
        }
    },
    stop() {
        clearPendingTransfer();
        lastUserChannels.clear();
        lastMyChannelId = null;
        lastMyChannelTime = 0;
    }
});
