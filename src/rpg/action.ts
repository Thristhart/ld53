import { Player } from "./basePlayer";

type GridLocation = [x: number, y: number];

export interface Action {
    id: string;
    targeting: (target: Player | GridLocation) => Array<Player | GridLocation>;
}
