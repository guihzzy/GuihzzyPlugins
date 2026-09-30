/*
 * Equicord, a Discord client mod
 * Copyright (c) 2026 Equicord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../../voiceChannelLog/components/VoiceChannelNotification.css";

import { createRoot, useEffect, useRef, useState } from "@webpack/common";
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

const HeadphonesIcon = () => (
    <svg className="vc-voice-log-notif-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

interface FakeDeafenCardProps {
    id: string;
    title: string;
    status: string;
    body: string;
    colorClass: "green" | "red" | "purple" | "orange" | "blue";
    onClose: () => void;
}

function FakeDeafenCard({ id, title, status, body, colorClass, onClose }: FakeDeafenCardProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const remainingTimeRef = useRef(4500);
    const startTimeRef = useRef(Date.now());

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
        startCloseTimer(4500);
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

    return (
        <div
            className={`vc-voice-log-notif-card ${isClosing ? "is-closing" : ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={triggerClose}
            style={{ cursor: "pointer" }}
        >
            <div className="vc-voice-log-notif-header">
                <div className="vc-voice-log-notif-header-left">
                    <HeadphonesIcon />
                    <span className="vc-voice-log-notif-title">{title}</span>
                    <span className="vc-voice-log-notif-dot-separator">•</span>
                    <div className="vc-voice-log-notif-status-wrapper">
                        <span className={`vc-voice-log-notif-status-dot ${colorClass}`} />
                        <span className="vc-voice-log-notif-status-text">{status}</span>
                    </div>
                </div>
                <div className="vc-voice-log-notif-header-right">
                    <span className="vc-voice-log-notif-time">agora</span>
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
                <div
                    style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: colorClass === "green" ? "rgba(34, 197, 94, 0.15)" : colorClass === "red" ? "rgba(239, 68, 68, 0.15)" : "rgba(168, 85, 247, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: colorClass === "green" ? "#22c55e" : colorClass === "red" ? "#ef4444" : "#a855f7" }}>
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                </div>
                <div className="vc-voice-log-notif-content">
                    <span className="vc-voice-log-notif-user">{title}</span>
                    <span className="vc-voice-log-notif-message">{body}</span>
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

export function showFakeDeafenPopup(options: {
    title: string;
    status: string;
    body: string;
    colorClass?: "green" | "red" | "purple" | "orange" | "blue";
}) {
    const root = getNotificationContainer();
    const thisID = notificationID++;

    return new Promise<void>(resolve => {
        const ToastNotification = (
            <FakeDeafenCard
                key={thisID.toString()}
                id={thisID.toString()}
                title={options.title}
                status={options.status}
                body={options.body}
                colorClass={options.colorClass ?? "purple"}
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
