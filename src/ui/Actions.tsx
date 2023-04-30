import { Player } from "~/rpg/basePlayer";
import "./Actions.css";
import { signal, useSignal } from "@preact/signals";
import { Action, GridLocation } from "~/rpg/action";
import classNames from "classnames";

export const selectedAction = signal<Action<Player> | Action<GridLocation> | undefined>(undefined);
export const selectedActionOption = signal<string | undefined>(undefined);

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
                {action.targetOptions && (
                    <ul className={"targetOptions"}>
                        {action.targetOptions.map((option) => (
                            <li key={option}>
                                <button
                                    onMouseOver={(e) => (e.target as HTMLElement).focus()}
                                    onClick={() => (selectedActionOption.value = option)}
                                    className={classNames(selectedActionOption.value === option && "selected")}>
                                    {option}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
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
                                onClick={() => {
                                    selectedAction.value = action;
                                    if (selectedAction.value.targetOptions) {
                                        selectedActionOption.value = selectedAction.value.targetOptions[0];
                                    }
                                }}>
                                {action.name}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
