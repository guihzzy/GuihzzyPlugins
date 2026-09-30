/*
 * Equicord, a Discord client mod
 * Copyright (c) 2026 Equicord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../../voiceChannelLog/components/VoiceChannelNotification.css";

import { openUserProfile } from "@utils/discord";
import { ChannelStore, createRoot, IconUtils, useEffect, useRef, useState, UserStore, NavigationRouter } from "@webpack/common";
import type { JSX } from "react";
import type { Root } from "react-dom/client";

let NotificationQueue: JSX.Element[] = [];
let notificationID = 0;
let RootContainer: Root | undefined;
let ToastContainer: HTMLDivElement | undefined;

function getNotificationContainer() {
    if (!RootContainer) {
        ToastContainer = document.createElement("div");
        ToastContainer.id = "vc-voice-log-notifications-container";
        document.body.append(ToastContainer);
        RootContainer = createRoot(ToastContainer);
    }
    if (ToastContainer) {
        ToastContainer.className = "vc-voice-log-notif-position-bottom-right";
    }
    return RootContainer;
}

const DMGroupIcon = () => (
    <svg className="vc-voice-log-notif-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const ServerIcon = () => (
    <svg className="vc-voice-log-notif-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

function NotificationCard({ id, message, channel, guild, onClose }: {
    id: string;
    message: any;
    channel: any;
    guild?: any;
    onClose: () => void;
}) {
    const [isClosing, setIsClosing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const remainingTimeRef = useRef(5000);
    const startTimeRef = useRef(Date.now());

    const author = UserStore.getUser(message.author.id) || { username: message.author.username || "Desconhecido" };
    const username = author.globalName ?? author.username;
    const avatarUrl = author.getAvatarURL?.(undefined, 64) || message.author.avatarURL || IconUtils.getDefaultAvatarURL(message.author.id);

    const isGuild = Boolean(guild && channel.guild_id);
    const titleText = isGuild
        ? (guild.name ? guild.name.toUpperCase() : "SERVIDOR")
        : "MENSAGEM DE GRUPO";
    const statusText = message.mention_everyone
        ? "Menção Geral"
        : (isGuild ? `#${channel.name || "canal"}` : "Mencionou você");
    const colorClass = message.mention_everyone ? "orange" : (isGuild ? "blue" : "purple");
    const timeText = "agora";

    const triggerClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const startCloseTimer = (duration: number) => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        startTimeRef.current = Date.now();
        remainingTimeRef.current = duration;
        closeTimerRef.current = setTimeout(() => {
            triggerClose();
        }, duration);
    };

    useEffect(() => {
        startCloseTimer(5000);
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            const elapsed = Date.now() - startTimeRef.current;
            remainingTimeRef.current = Math.max(remainingTimeRef.current - elapsed, 0);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (!isClosing) {
            startCloseTimer(remainingTimeRef.current);
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest(".vc-voice-log-notif-close") || target.closest(".vc-voice-log-notif-avatar") || target.closest(".vc-voice-log-notif-user")) {
            return;
        }
        if (isGuild) {
            NavigationRouter.transitionTo(`/channels/${guild.id}/${channel.id}/${message.id}`);
        } else {
            NavigationRouter.transitionTo(`/channels/@me/${channel.id}/${message.id}`);
        }
        triggerClose();
    };

    let content = message.content || "";
    message.mentions?.forEach((u: any) => {
        content = content.replace(new RegExp(`<@!?${u.id}>`, "g"), `@${u.username}`);
    });
    const bodyText = content.slice(0, 200) + (content.length > 200 ? "..." : "");

    return (
        <div
            className={`vc-voice-log-notif-card ${isClosing ? "is-closing" : ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleCardClick}
            style={{ cursor: "pointer" }}
        >
            <div className="vc-voice-log-notif-header">
                <div className="vc-voice-log-notif-header-left">
                    {isGuild ? <ServerIcon /> : <DMGroupIcon />}
                    <span className="vc-voice-log-notif-title" style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {titleText}
                    </span>
                    <span className="vc-voice-log-notif-dot-separator">•</span>
                    <div className="vc-voice-log-notif-status-wrapper">
                        <span className={`vc-voice-log-notif-status-dot ${colorClass}`} />
                        <span className="vc-voice-log-notif-status-text" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {statusText}
                        </span>
                    </div>
                </div>
                <div className="vc-voice-log-notif-header-right">
                    <span className="vc-voice-log-notif-time">{timeText}</span>
                    <button
                        type="button"
                        className="vc-voice-log-notif-close"
                        onClick={(e) => {
                            e.stopPropagation();
                            triggerClose();
                        }}
                        title="Fechar"
                    >
                        <CloseIcon />
                    </button>
                </div>
            </div>

            <div className="vc-voice-log-notif-body">
                <img
                    className="vc-voice-log-notif-avatar"
                    src={avatarUrl}
                    alt={username}
                    onClick={(e) => {
                        e.stopPropagation();
                        openUserProfile(message.author.id);
                    }}
                />
                <div className="vc-voice-log-notif-content">
                    <span
                        className="vc-voice-log-notif-user"
                        onClick={(e) => {
                            e.stopPropagation();
                            openUserProfile(message.author.id);
                        }}
                    >
                        {username}
                    </span>
                    <span className="vc-voice-log-notif-message">{bodyText}</span>
                </div>
            </div>

            <div className="vc-voice-log-notif-progress-bg">
                <div
                    className={`vc-voice-log-notif-progress-bar ${colorClass}`}
                    style={{ animationPlayState: isHovered ? "paused" : "running" }}
                />
            </div>
        </div>
    );
}

export function showDMGroupNotification(message: any, channel: any, guild?: any) {
    const root = getNotificationContainer();
    const thisID = notificationID++;

    return new Promise<void>(resolve => {
        const ToastNotification = (
            <NotificationCard
                key={thisID.toString()}
                id={thisID.toString()}
                message={message}
                channel={channel}
                guild={guild}
                onClose={() => {
                    NotificationQueue = NotificationQueue.filter(n => n.key !== thisID.toString());
                    if (RootContainer) {
                        RootContainer.render(<>{NotificationQueue}</>);
                    }
                    resolve();
                }}
            />
        );

        NotificationQueue.push(ToastNotification);

        if (NotificationQueue.length > 5) {
            NotificationQueue.shift();
        }

        root.render(<>{NotificationQueue}</>);
    });
}
