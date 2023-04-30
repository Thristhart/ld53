import { PositionAnimation } from "./animation";

export class BaseEntity {
    constructor(public x: number, public y: number) {}
    positionAnimation: PositionAnimation | undefined;
    draw(context: CanvasRenderingContext2D) {}
}
