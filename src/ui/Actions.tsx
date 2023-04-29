import { Player } from "~/rpg/basePlayer";
import "./Actions.css";
import { signal, useSignal } from "@preact/signals";
import { Action, GridLocation } from "~/rpg/action";

export const selectedAction = signal<Action<Player> | Action<GridLocation> | undefined>(undefined);

interface ActionProps {
    readonly player: Player;
}
export function Actions({ player }: ActionProps) {
    if (selectedAction.value) {
        const action = selectedAction.value;
        return (
            <>
                <h2>{action.name}</h2>
                <p>
                    {action.targetType === "grid" ? "Click on the grid to target" : "Click on a player to target"}.{" "}
                    {action.description}
                </p>
                <button className="cancel" onClick={() => (selectedAction.value = undefined)}>
                    &lt; Back
                </button>
            </>
        );
    }
    return (
        <>
            <h2>What will {player.displayName} do?</h2>
            <ul className="actions">
                {player.actions.map((action) => {
                    return (
                        <li>
                            <button
                                onMouseOver={(e) => (e.target as HTMLElement).focus()}
                                onClick={() => (selectedAction.value = action)}>
                                {action.name}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
