/*
 * Equicord, a Discord client mod
 * Copyright (c) 2026 Equicord and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface MentionLogEntry {
    id: string;
    messageId: string;
    channelId: string;
    guildId?: string | null;
    channelName: string;
    guildName?: string | null;
    authorId: string;
    authorName: string;
    authorGlobalName?: string | null;
    authorAvatar?: string | null;
    content: string;
    timestamp: Date;
    isGroupDM: boolean;
    isEveryone: boolean;
    isDirect: boolean;
}

const listeners = new Set<() => void>();
let mentionLogs: MentionLogEntry[] = [];
const MAX_LOGS = 200;

export function addMentionLog(entry: Omit<MentionLogEntry, "id" | "timestamp">) {
    const fullEntry: MentionLogEntry = {
        ...entry,
        id: `${entry.messageId}-${Date.now()}`,
        timestamp: new Date()
    };
    mentionLogs.unshift(fullEntry);
    if (mentionLogs.length > MAX_LOGS) {
        mentionLogs = mentionLogs.slice(0, MAX_LOGS);
    }
    notifyListeners();
}

export function getMentionLogs(): MentionLogEntry[] {
    return mentionLogs;
}

export function clearMentionLogs() {
    mentionLogs = [];
    notifyListeners();
}

export function subscribeMentionLogs(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notifyListeners() {
    for (const listener of listeners) {
        try {
            listener();
        } catch (e) {
            console.error("[DMGroupsNotification] Error notifying listener:", e);
        }
    }
}
