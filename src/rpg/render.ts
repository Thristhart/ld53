import { combatTime } from "./combat";

export function drawCombat(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "cornflowerblue";
    context.font = "32px Arial";
    context.fillText(`combat goes here ${combatTime.value}`, canvas.width / 2 - 100, canvas.height / 2);
}
