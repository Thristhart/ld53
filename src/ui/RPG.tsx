import { drawCombat } from "~/rpg/render";
import { Canvas } from "./Canvas";
import "./RPG.css";
import { useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";

export function RPG() {
    const size = useSignal<[number, number]>([640, 480]);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) {
            return;
        }
        function onResize() {
            if (!ref.current) {
                return;
            }
            const rect = ref.current.getBoundingClientRect();
            size.value = [rect.width, rect.height];
        }
        onResize();
        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(ref.current);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div id="rpg" ref={ref}>
            <Canvas width={size.value[0]} height={size.value[1]} tick={drawCombat} />
        </div>
    );
}

if (import.meta.hot) {
    import.meta.hot.accept();
}
