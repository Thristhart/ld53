import { loadImage } from "../loadImage";
import { addParticle } from "../render";
import bikeImagePath from "~/assets/bike.png";

const bikeImage = loadImage(bikeImagePath);

export function emitBikeParticle(x: number, y: number, toX: number, toY: number, onDestroy?: () => void) {
    const dx = toX - x;
    const dy = toY - y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    const particle = addParticle({
        x,
        y,
        velocityX: (dx / distance) * 20,
        velocityY: (dy / distance) * 20,
        lifetime: 1000,
        draw(context, dt) {
            context.drawImage(bikeImage, particle.x, particle.y, 128, 128);
            const dx = toX - particle.x;
            const dy = toY - particle.y;

            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 10) {
                particle.lifetime = 0;
            }
        },
        onDestroy,
    });
}
