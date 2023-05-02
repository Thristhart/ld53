import { addParticle } from "../render";

export function emitDamageParticle(x: number, y: number, damage: number) {
    const particle = addParticle({
        x,
        y,
        velocityX: 1 - Math.random() * 2,
        velocityY: -6 - Math.random() * 2,
        accelerationY: 0.2,
        lifetime: 600,
        draw(context, dt) {
            context.fillStyle = "red";
            context.font = "48px Montserrat";
            context.fillText(damage.toString(), particle.x, particle.y);
        },
    });
}
