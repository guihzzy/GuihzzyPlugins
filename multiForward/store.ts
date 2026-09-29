/*
 * Equicord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Message } from "@vencord/discord-types";
import { React } from "@webpack/common";

import { ForwardOrder } from "./types";

class MultiForwardStore {
    private selectedMessages: Map<string, Message> = new Map();
    private isSelecting: boolean = false;
    private activeChannelId: string | null = null;
    private order: ForwardOrder = "chronological";
    private listeners: Set<() => void> = new Set();
    public openModalFn: (() => void) | null = null;

    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    private emitChange(): void {
        for (const listener of this.listeners) {
            try {
                listener();
            } catch (e) {
                console.error("[MultiForward] Error in store listener:", e);
            }
        }
    }

    public getSnapshot = () => {
        return {
            isSelecting: this.isSelecting,
            selectedCount: this.selectedMessages.size,
            activeChannelId: this.activeChannelId,
            order: this.order,
            messagesMap: this.selectedMessages
        };
    };

    public getIsSelecting(): boolean {
        return this.isSelecting;
    }

    public getActiveChannelId(): string | null {
        return this.activeChannelId;
    }

    public getOrder(): ForwardOrder {
        return this.order;
    }

    public setOrder(order: ForwardOrder): void {
        this.order = order;
        this.emitChange();
    }

    public isSelected(messageId: string): boolean {
        return this.selectedMessages.has(messageId);
    }

    public getSelectionIndex(messageId: string): number {
        const ordered = this.getOrderedMessages();
        const idx = ordered.findIndex(m => m.id === messageId);
        return idx >= 0 ? idx + 1 : 0;
    }

    public startSelection(initialMessage?: Message, channelId?: string): void {
        const targetChannelId = channelId || initialMessage?.channel_id || null;
        if (this.activeChannelId && this.activeChannelId !== targetChannelId) {
            this.selectedMessages.clear();
        }

        this.isSelecting = true;
        this.activeChannelId = targetChannelId;

        if (initialMessage) {
            this.selectedMessages.set(initialMessage.id, initialMessage);
        }

        this.emitChange();
    }

    public toggleMessage(message: Message): void {
        if (!this.isSelecting) {
            this.startSelection(message, message.channel_id);
            return;
        }

        if (this.activeChannelId && this.activeChannelId !== message.channel_id) {
            // Se o usuário clicar em mensagem de outro canal, foca naquele canal
            this.selectedMessages.clear();
            this.activeChannelId = message.channel_id;
        }

        if (this.selectedMessages.has(message.id)) {
            this.selectedMessages.delete(message.id);
        } else {
            this.selectedMessages.set(message.id, message);
        }

        this.emitChange();
    }

    public selectMessage(message: Message): void {
        if (!this.isSelecting) {
            this.startSelection(message, message.channel_id);
            return;
        }
        this.selectedMessages.set(message.id, message);
        this.emitChange();
    }

    public deselectMessage(messageId: string): void {
        if (this.selectedMessages.delete(messageId)) {
            this.emitChange();
        }
    }

    public clearSelection(): void {
        this.selectedMessages.clear();
        this.emitChange();
    }

    public cancelSelection(): void {
        this.isSelecting = false;
        this.selectedMessages.clear();
        this.activeChannelId = null;
        this.emitChange();
    }

    public getSelectedMessages(): Message[] {
        return Array.from(this.selectedMessages.values());
    }

    public getOrderedMessages(): Message[] {
        const list = Array.from(this.selectedMessages.values());
        if (this.order === "chronological") {
            return list.sort((a, b) => {
                const timeA = new Date(a.timestamp?.toString() || 0).getTime();
                const timeB = new Date(b.timestamp?.toString() || 0).getTime();
                if (timeA !== timeB) return timeA - timeB;
                return a.id.localeCompare(b.id);
            });
        }
        return list;
    }

    public openForwardModal(): void {
        if (this.openModalFn) {
            this.openModalFn();
        }
    }
}

export const multiForwardStore = new MultiForwardStore();

export function useMultiForwardStore() {
    const [state, setState] = React.useState(() => multiForwardStore.getSnapshot());

    React.useEffect(() => {
        return multiForwardStore.subscribe(() => {
            setState(multiForwardStore.getSnapshot());
        });
    }, []);

    return {
        ...state,
        order: multiForwardStore.getOrder(),
        orderedMessages: multiForwardStore.getOrderedMessages(),
        isSelected: (msgId: string) => multiForwardStore.isSelected(msgId),
        getSelectionIndex: (msgId: string) => multiForwardStore.getSelectionIndex(msgId),
        toggleMessage: (msg: Message) => multiForwardStore.toggleMessage(msg),
        clearSelection: () => multiForwardStore.clearSelection(),
        cancelSelection: () => multiForwardStore.cancelSelection(),
        setOrder: (order: ForwardOrder) => multiForwardStore.setOrder(order),
        openForwardModal: () => multiForwardStore.openForwardModal()
    };
}
