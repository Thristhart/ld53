import { drawCombat, getPlayerUnderMouse, mouseLocationToGridLocation } from "~/rpg/render";
import { Canvas } from "./Canvas";
import "./RPG.css";
import { useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {
    currentActionTarget,
    currentCombat,
    endCombat,
    lastNPCLog,
    performCurrentPlayerAction,
    restartCombat,
} from "~/rpg/combat";
import { Player } from "~/rpg/basePlayer";
import { Actions, selectedAction } from "./Actions";
import { showDialog } from "~/story";
import { renderUI } from "./ui";

const VictoryOverlay = () => {
    return (
        <div
            className="victoryOverlay"
            onClick={() => {
                endCombat();
                showDialog();
                renderUI();
            }}>
            VICTORY
        </div>
    );
};

const DefeatOverlay = () => {
    return (
        <div
            className="defeatOverlay"
            onClick={() => {
                restartCombat();
                renderUI();
            }}>
            DEFEAT
            <span className="retry">RETRY?</span>
        </div>
    );
};

export function RPG() {
    const size = useSignal<[number, number]>([640, 480]);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) {
            return;
        }
        function onResize() {
            if (!ref.current) {
                return;
            }
            const rect = ref.current.getBoundingClientRect();
            size.value = [rect.width, rect.height];
        }
        onResize();
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(ref.current);
        return () => resizeObserver.disconnect();
    }, []);

    if (currentCombat?.state.value === "lost") {
        return <DefeatOverlay />;
    } else if (currentCombat?.state.value === "won") {
        return <VictoryOverlay />;
    }

    return (
        <div id="rpg">
            <div id="grid" ref={ref}>
                <Canvas
                    width={size.value[0]}
                    height={size.value[1]}
                    tick={drawCombat}
                    onMouseMove={(e) => {
                        const canvas = e.target as HTMLCanvasElement;
                        if (selectedAction.value && selectedAction.value.targetType === "grid") {
                            const location = mouseLocationToGridLocation(canvas, e.clientX, e.clientY);
                            currentActionTarget.value = location;
                        } else if (selectedAction.value && selectedAction.value.targetType === "player") {
                            const player = getPlayerUnderMouse(canvas, e.clientX, e.clientY);
                            currentActionTarget.value = player;
                        }
                    }}
                    onClick={
                        currentCombat?.currentTurn.value instanceof Player ? performCurrentPlayerAction : undefined
                    }
                />
            </div>
            <section id="status">
                <div className="statusText">
                    {currentCombat?.currentTurn.value instanceof Player ? (
                        <Actions player={currentCombat.currentTurn.value} />
                    ) : (
                        lastNPCLog
                    )}
                </div>
            </section>
        </div>
    );
}

if (import.meta.hot) {
    import.meta.hot.accept();
}
