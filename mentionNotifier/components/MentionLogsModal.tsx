/*
 * Equicord, a Discord client mod
 * Copyright (c) 2026 Equicord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RenderModalProps } from "@vencord/discord-types";
import { Button, Modal, NavigationRouter, openModal, React, ScrollerThin } from "@webpack/common";

import { clearMentionLogs, getMentionLogs, MentionLogEntry, subscribeMentionLogs } from "../logs";

export function openMentionLogsModal() {
    return openModal(props => (
        <MentionLogsModal props={props} />
    ));
}

function MentionLogsModal({ props }: { props: RenderModalProps; }) {
    const logs = React.useSyncExternalStore(subscribeMentionLogs, getMentionLogs);
    const [filter, setFilter] = React.useState<"all" | "guild" | "group">("all");

    const filteredLogs = React.useMemo(() => {
        if (filter === "guild") return logs.filter(l => !l.isGroupDM);
        if (filter === "group") return logs.filter(l => l.isGroupDM);
        return logs;
    }, [logs, filter]);

    const handleJump = (entry: MentionLogEntry) => {
        if (entry.guildId) {
            NavigationRouter.transitionTo(`/channels/${entry.guildId}/${entry.channelId}/${entry.messageId}`);
        } else {
            NavigationRouter.transitionTo(`/channels/@me/${entry.channelId}/${entry.messageId}`);
        }
        props.onClose();
    };

    return (
        <Modal
            {...props}
            size="lg"
            title="Histórico de Menções e Marcações"
            actions={[
                {
                    text: "Limpar Histórico",
                    variant: "dangerPrimary",
                    onClick: () => clearMentionLogs()
                },
                {
                    text: "Fechar",
                    variant: "secondary",
                    onClick: () => props.onClose()
                }
            ]}
        >
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", padding: "0 4px" }}>
                <Button
                    size={Button.Sizes.SMALL}
                    color={filter === "all" ? Button.Colors.BRAND : Button.Colors.PRIMARY}
                    onClick={() => setFilter("all")}
                >
                    Todos ({logs.length})
                </Button>
                <Button
                    size={Button.Sizes.SMALL}
                    color={filter === "guild" ? Button.Colors.BRAND : Button.Colors.PRIMARY}
                    onClick={() => setFilter("guild")}
                >
                    Servidores ({logs.filter(l => !l.isGroupDM).length})
                </Button>
                <Button
                    size={Button.Sizes.SMALL}
                    color={filter === "group" ? Button.Colors.BRAND : Button.Colors.PRIMARY}
                    onClick={() => setFilter("group")}
                >
                    Grupos / DMs ({logs.filter(l => l.isGroupDM).length})
                </Button>
            </div>

            <ScrollerThin style={{ maxHeight: "450px" }} fade>
                {filteredLogs.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                        Nenhuma menção registrada no histórico ainda.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {filteredLogs.map(entry => {
                            const timeStr = entry.timestamp.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                            });
                            const dateStr = entry.timestamp.toLocaleDateString("pt-BR");

                            return (
                                <div
                                    key={entry.id}
                                    onClick={() => handleJump(entry)}
                                    style={{
                                        backgroundColor: "var(--background-secondary)",
                                        border: "1px solid var(--background-tertiary)",
                                        borderRadius: "10px",
                                        padding: "12px 14px",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        cursor: "pointer",
                                        transition: "background-color 0.15s ease",
                                        gap: "12px"
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-secondary-alt)";
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--background-secondary)";
                                    }}
                                >
                                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                                        {entry.authorAvatar ? (
                                            <img
                                                src={entry.authorAvatar}
                                                alt={entry.authorName}
                                                style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0 }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "var(--brand-experiment)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#fff",
                                                    fontWeight: 600,
                                                    flexShrink: 0
                                                }}
                                            >
                                                {entry.authorName.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                                                <span style={{ fontWeight: 600, color: "var(--header-primary)", fontSize: "14px" }}>
                                                    {entry.authorGlobalName || entry.authorName}
                                                </span>
                                                <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                                                    @{entry.authorName}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        backgroundColor: entry.isGroupDM ? "rgba(168, 85, 247, 0.2)" : "rgba(59, 130, 246, 0.2)",
                                                        color: entry.isGroupDM ? "#c084fc" : "#60a5fa",
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {entry.isGroupDM ? "Grupo" : entry.guildName ? `Servidor: ${entry.guildName}` : "Servidor"}
                                                </span>
                                                <span style={{ fontSize: "12px", color: "var(--interactive-normal)" }}>
                                                    #{entry.channelName}
                                                </span>
                                                {entry.isEveryone && (
                                                    <span
                                                        style={{
                                                            fontSize: "10px",
                                                            padding: "1px 5px",
                                                            borderRadius: "4px",
                                                            backgroundColor: "rgba(245, 158, 11, 0.2)",
                                                            color: "#f59e0b",
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        @everyone/@here
                                                    </span>
                                                )}
                                            </div>

                                            <div
                                                style={{
                                                    color: "var(--text-normal)",
                                                    fontSize: "13px",
                                                    lineHeight: "1.4",
                                                    wordBreak: "break-word"
                                                }}
                                            >
                                                {entry.content || <i style={{ color: "var(--text-muted)" }}>[Sem conteúdo em texto]</i>}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, gap: "6px" }}>
                                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                            {dateStr} {timeStr}
                                        </span>
                                        <span style={{ fontSize: "11px", color: "var(--brand-experiment)", fontWeight: 500 }}>
                                            Clique para ir →
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollerThin>
        </Modal>
    );
}
