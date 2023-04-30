import { selectedAction } from "~/ui/Actions";
import { Player } from "./basePlayer";
import { combatTime, currentActionTarget, currentCombat } from "./combat";

export const camera = { x: 0, y: 0, scale: 1 };

export const GRID_SQUARE_WIDTH = 64;
export const GRID_SQUARE_HEIGHT = 32;

const COLOR_GRID_SQUARE_FILL_LIGHT = "hsl(171 12% 35%)";
const COLOR_GRID_SQUARE_FILL_DARK = "hsl(171 12% 25%)";
const COLOR_GRID_LINE_LIGHT = "#1e1e1e";
const COLOR_GRID_LINE_DARK = "black";

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
            gradient.addColorStop(0, COLOR_GRID_SQUARE_FILL_LIGHT);
            gradient.addColorStop(1, COLOR_GRID_SQUARE_FILL_DARK);
            context.fillStyle = gradient;
            context.fillRect(x * GRID_SQUARE_WIDTH, y * GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, GRID_SQUARE_HEIGHT);
        }
    }

    if (
        selectedAction.value &&
        selectedAction.value.targetType === "grid" &&
        currentActionTarget.value &&
        !(currentActionTarget.value instanceof Player)
    ) {
        const targets = selectedAction.value.targeting(currentActionTarget.value);
        for (const target of targets) {
            if (!(target instanceof Player)) {
                const [x, y] = target;
                const gradient = context.createRadialGradient(
                    x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2,
                    y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2,
                    0,
                    x * GRID_SQUARE_WIDTH + GRID_SQUARE_WIDTH / 2,
                    y * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 2,
                    GRID_SQUARE_HEIGHT * 1.2
                );
                gradient.addColorStop(0, "orange");
                gradient.addColorStop(1, "red");
                context.fillStyle = gradient;
                context.fillRect(x * GRID_SQUARE_WIDTH, y * GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, GRID_SQUARE_HEIGHT);
            }
        }
    }

    // grid lines
    for (let x = 0; x <= width; x++) {
        context.strokeStyle = COLOR_GRID_LINE_LIGHT;
        if (x === 0 || x === width) {
            context.strokeStyle = COLOR_GRID_LINE_DARK;
        }
        context.beginPath();
        context.moveTo(x * GRID_SQUARE_WIDTH, 0);
        context.lineTo(x * GRID_SQUARE_WIDTH, height * GRID_SQUARE_HEIGHT);
        context.closePath();
        context.stroke();
    }
    for (let y = 0; y <= height; y++) {
        context.strokeStyle = COLOR_GRID_LINE_LIGHT;
        if (y === 0 || y === height) {
            context.strokeStyle = COLOR_GRID_LINE_DARK;
        }
        context.beginPath();
        context.moveTo(0, y * GRID_SQUARE_HEIGHT);
        context.lineTo(width * GRID_SQUARE_WIDTH, y * GRID_SQUARE_HEIGHT);
        context.closePath();
        context.stroke();
    }

    context.fillStyle = COLOR_GRID_SQUARE_FILL_DARK;
    context.strokeStyle = COLOR_GRID_LINE_LIGHT;
    for (let x = 0; x < width; x++) {
        context.fillRect(x * GRID_SQUARE_WIDTH, height * GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, GRID_SQUARE_HEIGHT / 8);
    }
    for (let x = 0; x <= width; x++) {
        context.strokeStyle = COLOR_GRID_LINE_LIGHT;
        if (x === 0 || x === width) {
            context.strokeStyle = COLOR_GRID_LINE_DARK;
        }
        context.beginPath();
        context.moveTo(x * GRID_SQUARE_WIDTH, height * GRID_SQUARE_HEIGHT);
        context.lineTo(x * GRID_SQUARE_WIDTH, height * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 8);
        context.closePath();
        context.stroke();
    }
    context.strokeStyle = COLOR_GRID_LINE_DARK;
    context.beginPath();
    context.moveTo(0, height * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 8);
    context.lineTo(width * GRID_SQUARE_WIDTH, height * GRID_SQUARE_HEIGHT + GRID_SQUARE_HEIGHT / 8);
    context.closePath();
    context.stroke();
}

export const PLAYER_DRAW_WIDTH = 200;
export const PLAYER_DRAW_HEIGHT = 200;

function drawPlayers(context: CanvasRenderingContext2D, players: Player[]) {
    const startHeight = context.canvas.height / 2 - PLAYER_DRAW_HEIGHT * ((players.length - 1) / 2);
    players.forEach((player, index) => {
        if (currentCombat?.currentTurn.value === player) {
            context.strokeStyle = "white";
            context.strokeRect(
                leftPadding / 2 - PLAYER_DRAW_WIDTH / 2,
                index * PLAYER_DRAW_HEIGHT + startHeight - PLAYER_DRAW_HEIGHT / 2,
                PLAYER_DRAW_WIDTH,
                PLAYER_DRAW_HEIGHT
            );
        }
        if (
            selectedAction.value &&
            selectedAction.value.targetType === "player" &&
            currentActionTarget.value &&
            currentActionTarget.value === player
        ) {
            context.fillStyle = "rgb(206 251 255 / 30%)";
            context.fillRect(
                leftPadding / 2 - PLAYER_DRAW_WIDTH / 2,
                index * PLAYER_DRAW_HEIGHT + startHeight - PLAYER_DRAW_HEIGHT / 2,
                PLAYER_DRAW_WIDTH,
                PLAYER_DRAW_HEIGHT
            );
        }
        player.x = leftPadding / 2;
        player.y = index * PLAYER_DRAW_HEIGHT + startHeight;
        player.draw(context, leftPadding / 2, index * PLAYER_DRAW_HEIGHT + startHeight);
    });
}

function fitAreaOnScreen(
    canvas: HTMLCanvasElement,
    left: number,
    top: number,
    right: number,
    bottom: number,
    paddingLeft: number
) {
    const width = right - left;
    const height = bottom - top;
    const scale = Math.min((canvas.width - paddingLeft) / width, canvas.height / height);

    camera.x = left + width / 2;
    camera.y = top + height / 2;
    camera.scale = scale;
}

const leftPadding = PLAYER_DRAW_WIDTH * 2;
document.body.style.setProperty("--playerSize", `${leftPadding}px`);

export function mouseLocationToGridLocation(
    canvas: HTMLCanvasElement,
    mouseX: number,
    mouseY: number
): [x: number, y: number] | undefined {
    if (!currentCombat) {
        return;
    }
    const x = Math.floor(((mouseX - leftPadding / 2 - canvas.width / 2) / camera.scale + camera.x) / GRID_SQUARE_WIDTH);
    const y = Math.floor(((mouseY - canvas.height / 2) / camera.scale + camera.y) / GRID_SQUARE_HEIGHT);

    if (x < 0 || x >= currentCombat.width || y < 0 || y >= currentCombat.height) {
        return undefined;
    }
    return [x, y];
}

export function getPlayerUnderMouse(canvas: HTMLCanvasElement, mouseX: number, mouseY: number) {
    if (!currentCombat) {
        return undefined;
    }
    const players = currentCombat.players;
    const startHeight = canvas.height / 2 - PLAYER_DRAW_HEIGHT * ((players.length - 1) / 2);

    if (mouseX > leftPadding) {
        return undefined;
    }
    const index = Math.floor((mouseY - startHeight + PLAYER_DRAW_HEIGHT / 2) / PLAYER_DRAW_HEIGHT);
    return players[index];
}

export function gridLocationToCanvas(gridX: number, gridY: number) {
    return [
        g_canvas.width / 2 - camera.x * camera.scale + gridX * camera.scale * GRID_SQUARE_WIDTH + leftPadding / 2,
        g_canvas.height / 2 - camera.y * camera.scale + gridY * camera.scale * GRID_SQUARE_HEIGHT,
    ] as const;
}

interface Particle {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    lifetime: number;
    draw(context: CanvasRenderingContext2D, dt: number): void;
}

const particles = new Set<Particle>();

function drawParticles(context: CanvasRenderingContext2D, dt: number) {
    for (const particle of particles) {
        particle.lifetime -= dt;
        if (particle.lifetime <= 0) {
            particles.delete(particle);
        }
        particle.x += particle.velocityX * (dt / 16);
        particle.y += particle.velocityY * (dt / 16);
        particle.draw(context, dt);
    }
}

export function addParticle(particle: Particle) {
    particles.add(particle);
    return particle;
}

// ugh
let g_canvas: HTMLCanvasElement;
let lastTick = 0;
export function drawCombat(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const dt = combatTime.value - lastTick;
    lastTick = combatTime.value;
    g_canvas = canvas;
    context.imageSmoothingEnabled = false;
    combatTime.value;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!currentCombat) {
        return;
    }

    fitAreaOnScreen(
        canvas,
        0,
        -64,
        currentCombat.width * GRID_SQUARE_WIDTH,
        currentCombat.height * GRID_SQUARE_HEIGHT + 64,
        leftPadding
    );

    context.save();
    context.translate(leftPadding / 2, 0);
    context.translate(canvas.width / 2 - camera.x * camera.scale, canvas.height / 2 - camera.y * camera.scale);

    context.scale(camera.scale, camera.scale);

    drawGrid(context, currentCombat.width, currentCombat.height);

    for (const ent of currentCombat.entities) {
        ent.draw(context);
    }

    context.restore();

    drawPlayers(context, currentCombat.players);

    drawParticles(context, dt);
}

if (import.meta.env.DEV) {
    //@ts-ignore
    window.DEBUG_CAMERA = camera;
}
