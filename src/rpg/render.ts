import { combatTime } from "./combat";

const camera = { x: 0, y: 0, scale: 1 };

const GRID_SQUARE_WIDTH = 64;
const GRID_SQUARE_HEIGHT = 32;

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number) {
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const gradient = context.createRadialGradient(
                x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2,
                y * GRID_SQUARE_HEIGHT,
                0,
                x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2,
                y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 4,
                GRID_SQUARE_HEIGHT * 1.2
            );
            gradient.addColorStop(0, "hsl(171 12% 45%)");
            gradient.addColorStop(1, "hsl(171 12% 25%)");
            context.fillStyle = gradient;
            context.fillRect(x * GRID_SQUARE_WIDTH, y * GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, GRID_SQUARE_HEIGHT);
        }
    }

    context.strokeStyle = "black";

    // grid lines
    for (let x = 0; x <= width; x++) {
        context.beginPath();
        context.moveTo(x * GRID_SQUARE_WIDTH, 0);
        context.lineTo(x * GRID_SQUARE_WIDTH, height * GRID_SQUARE_HEIGHT);
        context.closePath();
        context.stroke();
    }
    for (let y = 0; y <= height; y++) {
        context.beginPath();
        context.moveTo(0, y * GRID_SQUARE_HEIGHT);
        context.lineTo(width * GRID_SQUARE_WIDTH, y * GRID_SQUARE_HEIGHT);
        context.closePath();
        context.stroke();
    }
}

function fitAreaOnScreen(canvas: HTMLCanvasElement, left: number, top: number, right: number, bottom: number) {
    const width = right - left;
    const height = bottom - top;
    const smallestDimension = Math.min(width, height);
    const scale = Math.min(canvas.width / width, canvas.height / height);

    camera.x = left + width / 2;
    camera.y = top + height / 2;
    camera.scale = scale;
}

export function drawCombat(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    combatTime.value;
    context.clearRect(0, 0, canvas.width, canvas.height);

    fitAreaOnScreen(canvas, 0, -64, 5 * GRID_SQUARE_WIDTH, 10 * GRID_SQUARE_HEIGHT + 64);

    context.save();
    context.translate(canvas.width / 2 - camera.x * camera.scale, canvas.height / 2 - camera.y * camera.scale);

    context.scale(camera.scale, camera.scale);

    drawGrid(context, 5, 10);

    context.restore();
}
