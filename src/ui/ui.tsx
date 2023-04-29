
import { render } from "preact";
import { useState } from "preact/hooks";
import { shouldShowDialog } from "~/story";
import { Dialogue } from "./Dialogue";

const uiContainer = document.getElementById("ui")!;

if (!uiContainer) {
    throw new Error("missing required #ui element");
}

function UI() {
    const [isTitleScreen, setIsTitleScreen] = useState(true);

    if (isTitleScreen) {
        return (
            <div id="titleScreen" onClick={() => setIsTitleScreen(false)}>
                <span className="title1">CASSIE'S</span>
                <div id="logo" />
                <span className="title2">HAT</span>
            </div>
        );
    }
    return (
        <>
            {/* <RPG /> */}
            {shouldShowDialog() && <Dialogue />}
        </>
    );
};

export function renderUI() {
    render(<UI />, uiContainer);
}