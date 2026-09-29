/*
 * Equicord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { sendMessage } from "@utils/discord";
import { Message } from "@vencord/discord-types";
import { Constants, RestAPI, showToast, Toasts } from "@webpack/common";

export interface ForwardProgress {
    current: number;
    total: number;
    channelName?: string;
}

export async function forwardMessages(
    messages: Message[],
    channelIds: string[],
    note: string,
    delayMs: number = 250,
    onProgress?: (progress: ForwardProgress) => void
): Promise<{ success: boolean; totalForwarded: number; errors: number; }> {
    if (!messages.length || !channelIds.length) {
        return { success: false, totalForwarded: 0, errors: 0 };
    }

    const totalOperations = messages.length * channelIds.length;
    let completed = 0;
    let errors = 0;

    for (const channelId of channelIds) {
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const isFirst = i === 0;
            const content = isFirst && note.trim() ? note.trim() : "";

            try {
                // Tenta encaminhar usando a API nativa de forward do Discord (type: 1)
                const res = await RestAPI.post({
                    url: Constants.Endpoints.MESSAGES(channelId),
                    body: {
                        content,
                        channel_id: channelId,
                        type: 0,
                        message_reference: {
                            type: 1, // MessageReferenceType.FORWARD
                            channel_id: message.channel_id,
                            message_id: message.id
                        }
                    }
                }) as { ok?: boolean; status?: number; };

                if (res?.ok === false) {
                    throw new Error(`Falha HTTP ${res?.status || "desconhecida"}`);
                }
            } catch (err: any) {
                console.warn("[MultiForward] Falha ao encaminhar nativamente, usando fallback:", err);
                try {
                    // Fallback gracioso: envia como citação formatada para nunca perder a mensagem
                    const authorName = message.author?.username || "Usuário";
                    let fallbackText = content ? `${content}\n\n` : "";
                    fallbackText += `> ↪ **Encaminhado de <#${message.channel_id}>** (*${authorName}*):\n`;
                    if (message.content) {
                        fallbackText += `> ${message.content.replace(/\n/g, "\n> ")}\n`;
                    }
                    if (message.attachments && message.attachments.length > 0) {
                        fallbackText += `> ${message.attachments.map(a => a.url).join("\n> ")}`;
                    }

                    await sendMessage(channelId, { content: fallbackText });
                } catch (fallbackErr) {
                    console.error("[MultiForward] Erro no envio de fallback:", fallbackErr);
                    errors++;
                }
            }

            completed++;
            if (onProgress) {
                onProgress({ current: completed, total: totalOperations });
            }

            // Pequeno delay para respeitar o limite de taxa do Discord e garantir ordem exata
            if (delayMs > 0 && completed < totalOperations) {
                await new Promise(r => setTimeout(r, delayMs));
            }
        }
    }

    const success = errors < totalOperations;
    if (success) {
        showToast(
            `${messages.length} mensagem${messages.length > 1 ? "s" : ""} encaminhada${messages.length > 1 ? "s" : ""} com sucesso!`,
            Toasts.Type.SUCCESS
        );
    } else {
        showToast("Houve um erro ao encaminhar algumas mensagens.", Toasts.Type.FAILURE);
    }

    return {
        success,
        totalForwarded: completed - errors,
        errors
    };
}
