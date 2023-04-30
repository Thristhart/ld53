import { loadImage } from "../loadImage";
import { addParticle } from "../render";
import handcuffImagePath from "~/assets/handcuffs.png";

const handcuffImage = loadImage(handcuffImagePath);

export function emitHandcuffParticle(x: number, y: number, toX: number, toY: number) {
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
            context.drawImage(handcuffImage, particle.x, particle.y, 60, 60);
            const dx = toX - particle.x;
            const dy = toY - particle.y;

            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 10) {
                particle.lifetime = 0;
            }
        },
    });
}
