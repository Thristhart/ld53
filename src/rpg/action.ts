import { Actor } from "./actor";
import { Player } from "./basePlayer";

export type GridLocation = [x: number, y: number];

export interface Action<TargetType extends Player | GridLocation> {
    id: string;
    name: string;
    description: string;
    animation?: {
        animate: (this: Actor, target: TargetType, targets: TargetType[]) => Promise<void>;
    };
    targetType: TargetType extends Player ? "player" : "grid";
    targeting: (target: TargetType, targetOption: string | undefined) => Array<TargetType>;
    targetOptions?: ReadonlyArray<string>;
    apply: (
        this: Actor<Action<TargetType>>,
        targets: Array<TargetType>,
        targetOption: string | undefined
    ) => Promise<void>;
}
