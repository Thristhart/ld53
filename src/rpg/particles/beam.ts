import beamImagePath from "~/assets/beam.png";
import beamVerticalImagePath from "~/assets/beam_vertical.png";
import { loadImage } from "../loadImage";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, addParticle, camera } from "../render";

const beamSheet: SpriteSheet = {
    image: loadImage(beamImagePath),
    spriteWidth: 192,
    spriteHeight: 64,
};

const beamVerticalSheet: SpriteSheet = {
    image: loadImage(beamVerticalImagePath),
    spriteWidth: 64,
    spriteHeight: 192,
};

export function emitBeamParticle(x: number, y: number, direction: "Vertical" | "Horizontal") {
    let sheet: SpriteSheet;
    let dimensions: { width: number; height: number };
    if (direction === "Horizontal") {
        sheet = beamSheet;
        dimensions = { width: GRID_SQUARE_WIDTH * 3 * camera.scale, height: GRID_SQUARE_WIDTH * camera.scale };
    } else {
        sheet = beamVerticalSheet;
        const aspectRatio = sheet.spriteWidth / sheet.spriteHeight;
        const height = GRID_SQUARE_HEIGHT * 3 * camera.scale;
        dimensions = {
            width: height * aspectRatio,
            height,
        };
    }
    const particle = addParticle({
        x,
        y: y - GRID_SQUARE_HEIGHT,
        velocityX: 0,
        velocityY: 4,
        lifetime: 500,
        draw(context, dt) {
            if (particle.y > y) {
                particle.y = y;
            }
            drawSprite(context, sheet, particle.x, particle.y, [0, 0], dimensions);
        },
    });
}
