/*
 * Equicord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Message } from "@vencord/discord-types";
import { React, Tooltip } from "@webpack/common";

import { useMultiForwardStore } from "../store";

export function MessageSelectionIndicator({ message }: { message: Message; }) {
    const { isSelecting, isSelected, getSelectionIndex, toggleMessage } = useMultiForwardStore();

    if (!isSelecting && !isSelected(message.id)) {
        return null;
    }

    const selected = isSelected(message.id);
    const orderIndex = selected ? getSelectionIndex(message.id) : 0;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMessage(message);
    };

    return (
        <Tooltip text={selected ? `Mensagem #${orderIndex} selecionada (clique para remover)` : "Clique para selecionar para encaminhar"}>
            {tooltipProps => (
                <div
                    {...tooltipProps}
                    className={`vc-multiforward-indicator ${selected ? "selected" : ""}`}
                    onClick={handleClick}
                    role="checkbox"
                    aria-checked={selected}
                >
                    {selected ? (
                        <span className="vc-multiforward-indicator-badge">{orderIndex}</span>
                    ) : (
                        <div className="vc-multiforward-indicator-box" />
                    )}
                </div>
            )}
        </Tooltip>
    );
}
