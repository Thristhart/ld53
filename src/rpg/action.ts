import { Player } from "./basePlayer";

export type GridLocation = [x: number, y: number];

export interface Action {
    id: string;
    name: string;
    description: string;
    targetType: "player" | "grid";
    targeting: (target: Player | GridLocation) => Array<Player | GridLocation>;
    animation?: {
        duration: number;
        animate: (dt: number) => void;
    };
}
