import barrierImagePath from "~/assets/barrier.png";
import { loadImage } from "../loadImage";
import { drawCenteredText } from "../drawCenteredText";

const barrierImage = loadImage(barrierImagePath);

export function drawBarrier(context: CanvasRenderingContext2D, x: number, y: number, barrierAmount: number) {
    context.drawImage(barrierImage, x, y);
    drawCenteredText(context, barrierAmount.toString(), x + 15, y + 10, "black", "white");
}
