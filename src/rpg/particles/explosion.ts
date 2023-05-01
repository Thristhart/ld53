import explosionSheetPath from "~/assets/explosion.png";
import { SpriteSheet, drawSprite } from "../drawSprite";
import { loadImage } from "../loadImage";
import { GRID_SQUARE_HEIGHT, GRID_SQUARE_WIDTH, addParticle, camera } from "../render";
import { makeFrameAnimation } from "../animation";

const explosionSheet: SpriteSheet = {
    image: loadImage(explosionSheetPath),
    spriteWidth: 64,
    spriteHeight: 64,
};

export function emitExplosionParticle(x: number, y: number) {
    const frameAnimation = makeFrameAnimation(
        [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [3, 1],
        ],
        33
    );
    const lifetime = frameAnimation.frames.length * frameAnimation.timePerFrame;
    const particle = addParticle({
        x,
        y,
        velocityX: 0,
        velocityY: 0,
        lifetime,
        draw(context, dt) {
            frameAnimation.tick(lifetime - particle.lifetime);
            if (frameAnimation.frames[frameAnimation.currentIndex]) {
                drawSprite(
                    context,
                    explosionSheet,
                    particle.x,
                    particle.y,
                    frameAnimation.frames[frameAnimation.currentIndex],
                    {
                        width: GRID_SQUARE_WIDTH * camera.scale,
                        height: GRID_SQUARE_HEIGHT * camera.scale,
                    }
                );
            }
        },
    });
}
