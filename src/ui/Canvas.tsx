import { useSignal, useSignalEffect } from "@preact/signals";
import type { RefObject } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { JSXInternal } from "preact/src/jsx";

interface CanvasProps extends JSXInternal.HTMLAttributes<HTMLCanvasElement> {
    readonly width: number;
    readonly height: number;
    readonly tick?: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void;
    readonly canvasRef?: RefObject<HTMLCanvasElement>;
    readonly className?: string;
    readonly onClick?: () => void;
    readonly disableContext?: boolean;
}
export const Canvas = ({
    width,
    height,
    tick,
    canvasRef,
    className,
    onClick,
    disableContext = false,
    ...canvasProps
}: CanvasProps) => {
    const internalRef = useRef<HTMLCanvasElement>(null);
    const ref = canvasRef ?? internalRef;
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const canvasSignal = useSignal<HTMLCanvasElement | undefined>(undefined);

    useEffect(() => {
        const canvas = ref.current;
        if (canvas) {
            canvasSignal.value = canvas;
            if (!disableContext) {
                contextRef.current = canvas.getContext("2d");
                if (contextRef.current) {
                    contextRef.current.imageSmoothingEnabled = false;
                }
            }
        }
    }, []);

    useSignalEffect(() => {
        if (canvasSignal.value) {
            tick?.(canvasSignal.value, contextRef.current!);
        }
    });

    return <canvas ref={ref} width={width} height={height} className={className} onClick={onClick} {...canvasProps} />;
};
