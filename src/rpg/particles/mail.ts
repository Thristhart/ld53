import mailImagePath from "~/assets/letter.png";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, addParticle, camera, gridLocationToCanvas } from "../render";
import { GridLocation } from "../action";
import { wait } from "~/util/wait";

const mailImage = loadImage(mailImagePath);

function emitMailParticle(x: number, y: number) {
    const particle = addParticle({
        x,
        y,
        velocityX: 4 - Math.random() * 8,
        velocityY: 4 - Math.random() * 8,
        lifetime: 800,
        draw(context, dt) {
            context.drawImage(mailImage, particle.x, particle.y);
        },
    });
}

export async function mailStormParticles(gridLoc: GridLocation) {
    const screenPos = gridLocationToCanvas(gridLoc[0], gridLoc[1]);
    for (let i = 0; i < 160; i++) {
        emitMailParticle(
            screenPos[0] +
                (GRID_SQUARE_WIDTH / 2 + Math.random() * (GRID_SQUARE_WIDTH / 6) - GRID_SQUARE_WIDTH / 3) *
                    camera.scale,
            screenPos[1] +
                (GRID_SQUARE_HEIGHT / 2 + Math.random() * (GRID_SQUARE_HEIGHT / 6) - GRID_SQUARE_HEIGHT / 3) *
                    camera.scale
        );
        await wait(8);
    }
}
