import { render } from "preact";
import { useState } from "preact/hooks";
import { shouldShowDialog } from "~/story";
import { Dialogue } from "./Dialogue";
import "./ui.css";
import "./speakers.css";
import { RPG } from "./RPG";
import { shouldShowCombat } from "~/rpg/combat";

const uiContainer = document.getElementById("ui")!;

if (!uiContainer) {
    throw new Error("missing required #ui element");
}

function UI() {
    const [isTitleScreen, setIsTitleScreen] = useState(false);

    if (isTitleScreen) {
        return (
            <div id="titleScreen" onClick={() => setIsTitleScreen(false)}>
                <span className="title1">CASSIE'S</span>
                <div id="logo" />
                <span className="title2">TRUCK</span>
            </div>
        );
    }
    return (
        <>
            {shouldShowCombat() && <RPG />}
            {shouldShowDialog() && <Dialogue />}
        </>
    );
}

export function renderUI() {
    render(<UI />, uiContainer);
}
