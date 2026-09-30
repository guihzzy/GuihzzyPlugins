/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { UserAreaButton, UserAreaButtonFactory, UserAreaRenderProps } from "@api/UserArea";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps } from "@webpack";
import { React, UserStore } from "@webpack/common";

import { showFakeDeafenPopup } from "./components/FakeDeafenPopup";

type IconMode = "deafen_only" | "mute_only" | "both_muted" | "both_active";

type GatewaySocket = {
    send: (op: number, data: any, ...args: any[]) => any;
};

const settings = definePluginSettings({
    iconMode: {
        type: OptionType.SELECT,
        description: "Define como seu estado de voz aparecerá para os outros usuários na chamada enquanto você continua ouvindo e falando normalmente.",
        options: [
            { label: "Apenas Ensurdecido (Aparece com fone cortado)", value: "deafen_only", default: true },
            { label: "Apenas Mutado (Aparece com microfone cortado)", value: "mute_only" },
            { label: "Mutado e Ensurdecido (Aparece com fone e microfone cortados)", value: "both_muted" },
            { label: "Normal / Invisível (Aparece totalmente ativo, sem nenhum ícone)", value: "both_active" }
        ]
    }
});

let faking = false;
let originalGatewaySend: GatewaySocket["send"] | null = null;
let hookedSocket: GatewaySocket | null = null;

function log(text: string) {
    new Logger("FakeDeafen", "#7b4af7").info(text);
}

function getMode(): IconMode {
    return (settings.store.iconMode as IconMode) ?? "deafen_only";
}

function getForcedVoiceState(mode = getMode()) {
    switch (mode) {
        case "deafen_only":
            return { self_mute: false, self_deaf: true };
        case "mute_only":
            return { self_mute: true, self_deaf: false };
        case "both_muted":
            return { self_mute: true, self_deaf: true };
        case "both_active":
        default:
            return { self_mute: false, self_deaf: false };
    }
}

function getGatewaySocket(): GatewaySocket | null {
    try {
        const wsModule = findByProps("getSocket");
        return wsModule?.getSocket?.() ?? null;
    } catch (error) {
        log(`Falha ao localizar Gateway socket: ${String(error)}`);
        return null;
    }
}

function getCurrentVoicePayload() {
    const ChannelStore = findByProps("getChannel", "getDMFromUserId");
    const SelectedChannelStore = findByProps("getVoiceChannelId");

    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return null;

    const channel = ChannelStore?.getChannel?.(channelId);
    return {
        guild_id: channel?.guild_id ?? null,
        channel_id: channelId,
        self_mute: false,
        self_deaf: false,
        self_video: false,
        flags: 0
    };
}

/**
 * Intercepta o wrapper interno do Gateway do Discord.
 *
 * Isso é mais confiável que sobrescrever WebSocket.prototype.send, porque o
 * Discord/Vencord atualmente envia voice state pelo wrapper socket.send(op, data).
 * O estado local de áudio não é alterado; apenas o payload OP 4 que sai para o
 * Gateway é reescrito enquanto o fake estiver ligado.
 */
function startIntercepting() {
    if (hookedSocket && originalGatewaySend) return true;

    const socket = getGatewaySocket();
    if (!socket || typeof socket.send !== "function") {
        showFakeDeafenPopup({
            title: "FAKEDEAFEN ERRO",
            status: "Falha",
            body: "Não foi possível localizar o socket do Gateway.",
            colorClass: "red"
        });
        return false;
    }

    hookedSocket = socket;
    originalGatewaySend = socket.send;

    socket.send = function (op: number, data: any, ...args: any[]) {
        if (op === 4 && faking && data) {
            const forced = getForcedVoiceState();

            // IMPORTANTE: define os DOIS campos explicitamente.
            // Isso evita que um estado real anterior (ex.: mute=true) vaze para
            // um modo que deveria mostrar somente o fone ou somente o microfone.
            data = {
                ...data,
                self_mute: forced.self_mute,
                self_deaf: forced.self_deaf
            };

            log(`OP4 interceptado -> mute=${data.self_mute}, deaf=${data.self_deaf}`);
        }

        return originalGatewaySend!.apply(this, [op, data, ...args]);
    };

    return true;
}

function stopIntercepting() {
    if (hookedSocket && originalGatewaySend) {
        hookedSocket.send = originalGatewaySend;
    }

    hookedSocket = null;
    originalGatewaySend = null;
}

/** Envia imediatamente o estado visual fake sem tocar no mute/deafen local. */
function pushVoiceState(fake: boolean) {
    const socket = getGatewaySocket();
    const payload = getCurrentVoicePayload();

    if (!socket || !payload) {
        log("Não conectado a um canal de voz; estado não enviado.");
        return false;
    }

    if (fake) {
        const forced = getForcedVoiceState();
        payload.self_mute = forced.self_mute;
        payload.self_deaf = forced.self_deaf;
    } else {
        // Ao desligar o fake, volta a anunciar o estado normal ativo.
        // Como o plugin não altera o áudio local, false/false é o estado esperado.
        payload.self_mute = false;
        payload.self_deaf = false;
    }

    // Enquanto faking=true, o próprio interceptor também garante os valores.
    socket.send(4, payload);
    return true;
}

function enableFakeDeafen() {
    if (faking) return;

    if (!startIntercepting()) return;

    faking = true;
    pushVoiceState(true);

    const messages: Record<IconMode, string> = {
        deafen_only: "Servidor: apenas surdo. Localmente você continua ouvindo e falando.",
        mute_only: "Servidor: apenas mutado. Localmente você continua ouvindo e falando.",
        both_muted: "Servidor: surdo + mutado. Localmente você continua ouvindo e falando.",
        both_active: "Servidor: ativo (sem mute/deafen). Localmente tudo continua normal."
    };

    const statusTexts: Record<IconMode, string> = {
        deafen_only: "Ensurdecido",
        mute_only: "Mutado",
        both_muted: "Mutado + Ensurdecido",
        both_active: "Ativo"
    };

    const mode = getMode();
    showFakeDeafenPopup({
        title: "FAKEDEAFEN ATIVADO",
        status: statusTexts[mode],
        body: messages[mode],
        colorClass: mode === "both_active" ? "green" : "purple"
    });
    log(`Ativado — modo: ${mode}`);
}

function disableFakeDeafen() {
    if (!faking) return;

    // Primeiro desliga o rewrite, depois manda false/false real.
    faking = false;
    stopIntercepting();
    pushVoiceState(false);

    showFakeDeafenPopup({
        title: "FAKEDEAFEN DESATIVADO",
        status: "Normal",
        body: "Estado de voz visual restaurado ao padrão.",
        colorClass: "green"
    });
    log("Desativado");
}

// ─── SVG Paths ─────────────────────────────────────────────────────────────────

const redLinePath = "M22.7 2.7a1 1 0 0 0-1.4-1.4l-20 20a1 1 0 1 0 1.4 1.4Z";
const maskBlackPath = "M23.27 4.73 19.27 .73 -.27 20.27 3.73 24.27Z";
const headphonesPath = "M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z";
const micPath = "M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zm-1 14.93A7.001 7.001 0 0 1 5 11H3a9 9 0 0 0 8 8.94V22h2v-2.06A9 9 0 0 0 21 11h-2a7 7 0 0 1-6 6.93z";

function FakeDeafenStaticIcon({ className }: { className?: string; }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d={headphonesPath} />
        </svg>
    );
}

function MutedMicSvg({ className, size = 20 }: { className?: string; size?: number; }) {
    const maskId = `fd-mic-mask-${size}`;
    return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24">
            <path fill="var(--status-danger)" mask={`url(#${maskId})`} d={micPath} />
            <path fill="var(--status-danger)" d={redLinePath} />
            <mask id={maskId}>
                <rect fill="white" x="0" y="0" width="24" height="24" />
                <path fill="black" d={maskBlackPath} />
            </mask>
        </svg>
    );
}

function DeafenedSvg({ className, size = 20 }: { className?: string; size?: number; }) {
    const maskId = `fd-deafen-mask-${size}`;
    return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24">
            <path fill="var(--status-danger)" mask={`url(#${maskId})`} d={headphonesPath} />
            <path fill="var(--status-danger)" d={redLinePath} />
            <mask id={maskId}>
                <rect fill="white" x="0" y="0" width="24" height="24" />
                <path fill="black" d={maskBlackPath} />
            </mask>
        </svg>
    );
}

function FakeDeafenIcon({ active, className }: { active: boolean; className?: string; }) {
    if (!active) return <FakeDeafenStaticIcon className={className} />;

    const mode = getMode();

    if (mode === "both_active") {
        return (
            <svg className={className} width="20" height="20" viewBox="0 0 24 24">
                <path fill="var(--green-360, #23a55a)" d={headphonesPath} />
            </svg>
        );
    }

    if (mode === "mute_only") return <MutedMicSvg className={className} />;

    if (mode === "both_muted") {
        // No botão do plugin mostramos os dois estados juntos.
        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "1px" }}>
                <DeafenedSvg className={className} size={18} />
                <MutedMicSvg className={className} size={18} />
            </span>
        );
    }

    return <DeafenedSvg className={className} />;
}

function FakeDeafenButton({ iconForeground, hideTooltips, nameplate }: UserAreaRenderProps) {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

    const handleToggle = React.useCallback(() => {
        if (faking) disableFakeDeafen();
        else enableFakeDeafen();
        forceUpdate();
    }, []);

    const mode = getMode();
    const modeTooltip: Record<IconMode, string> = {
        deafen_only: "FakeDeafen (apenas surdo)",
        mute_only: "FakeDeafen (apenas mutado)",
        both_muted: "FakeDeafen (surdo + mutado)",
        both_active: "FakeDeafen (ambos ativos)"
    };

    return (
        <UserAreaButton
            tooltipText={hideTooltips ? void 0 : faking ? `Desativar ${modeTooltip[mode]}` : "Ativar FakeDeafen"}
            icon={<FakeDeafenIcon active={faking} className={iconForeground} />}
            role="switch"
            aria-checked={faking}
            redGlow={faking && mode !== "both_active"}
            plated={nameplate != null}
            onClick={handleToggle}
        />
    );
}

const FakeDeafenUserAreaButton: UserAreaButtonFactory = (props: UserAreaRenderProps) => <FakeDeafenButton {...props} />;

// O Discord normalmente prioriza o ícone de deafen quando self_deaf=true.
// Este componente acrescenta o mic somente NA SUA interface no modo ambos.
function FakeMutedMicIcon() {
    return <MutedMicSvg size={16} />;
}

export default definePlugin({
    name: "FakeDeafen",
    description: "Controla o estado visual de mute/deafen enviado ao Gateway sem alterar o áudio local.",
    authors: [{ name: "guihzzy", id: 408002057522380801n }],
    dependencies: ["UserAreaAPI"],
    settings,

    patches: [
        {
            find: ".VOICE_PANEL}}",
            replacement: [
                {
                    match: /\}\),children:\[(?=.{0,50}#{intl::PRIORITY_SPEAKER})/,
                    replace: "$&$self.renderVoiceIcons(arguments[0]?.user),"
                }
            ]
        }
    ],

    renderVoiceIcons(user: any) {
        if (!faking || !user) return null;
        if (user.id !== UserStore.getCurrentUser()?.id) return null;
        if (getMode() !== "both_muted") return null;

        return <FakeMutedMicIcon />;
    },

    userAreaButton: {
        icon: FakeDeafenStaticIcon,
        render: FakeDeafenUserAreaButton
    },

    start() {
        // Hook antecipado para também capturar futuras atualizações OP4 enquanto ativo.
        startIntercepting();
        log("Pronto");
    },

    stop() {
        if (faking) {
            faking = false;
            stopIntercepting();
            pushVoiceState(false);
        } else {
            stopIntercepting();
        }
        log("Desarmado");
    }
});
