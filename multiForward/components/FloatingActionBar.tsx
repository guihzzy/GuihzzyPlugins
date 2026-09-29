/*
 * Equicord, a Discord client mod
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, React } from "@webpack/common";

import { useMultiForwardStore } from "../store";

export function FloatingActionBar() {
    const {
        isSelecting,
        selectedCount,
        order,
        setOrder,
        clearSelection,
        cancelSelection,
        openForwardModal
    } = useMultiForwardStore();

    if (!isSelecting) {
        return null;
    }

    const toggleOrder = () => {
        setOrder(order === "chronological" ? "selection" : "chronological");
    };

    return (
        <div className="vc-multiforward-floating-bar-wrapper">
            <div className="vc-multiforward-floating-bar">
                <div className="vc-multiforward-bar-left">
                    <div className="vc-multiforward-bar-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 3a1 1 0 0 1 .7.3l9 9a1 1 0 0 1 0 1.4l-9 9A1 1 0 0 1 9 22V16.94C4.16 17.38 2.11 20.37 2.05 20.47a1 1 0 0 1-1.74-.9C1.19 13.9 4.3 9.4 9 9.06V4a1 1 0 0 1 1-1Z" />
                        </svg>
                    </div>
                    <div className="vc-multiforward-bar-text-group">
                        <span className="vc-multiforward-bar-count">
                            {selectedCount === 1 ? "1 mensagem selecionada" : `${selectedCount} mensagens selecionadas`}
                        </span>
                        <span className="vc-multiforward-bar-hint">
                            Clique nas mensagens do chat para selecionar ou desmarcar
                        </span>
                    </div>
                </div>

                <div className="vc-multiforward-bar-actions">
                    <button
                        className="vc-multiforward-btn vc-multiforward-btn-secondary"
                        onClick={toggleOrder}
                        title="Alternar entre ordem cronológica ou ordem de clique"
                    >
                        {order === "chronological" ? "🕒 Ordem Cronológica" : "🔢 Ordem de Clique"}
                    </button>

                    {selectedCount > 0 && (
                        <button
                            className="vc-multiforward-btn vc-multiforward-btn-secondary"
                            onClick={clearSelection}
                            title="Desmarcar todas as mensagens"
                        >
                            Limpar
                        </button>
                    )}

                    <button
                        className="vc-multiforward-btn vc-multiforward-btn-cancel"
                        onClick={cancelSelection}
                        title="Cancelar seleção (Esc)"
                    >
                        Cancelar
                    </button>

                    <Button
                        color={Button.Colors.BRAND}
                        size={Button.Sizes.SMALL}
                        disabled={selectedCount === 0}
                        onClick={openForwardModal}
                        className="vc-multiforward-send-btn"
                    >
                        Encaminhar {selectedCount > 0 ? `(${selectedCount})` : ""} ➜
                    </Button>
                </div>
            </div>
        </div>
    );
}
