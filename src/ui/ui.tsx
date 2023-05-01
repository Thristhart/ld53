import { render } from "preact";
import { useState } from "preact/hooks";
import { shouldShowDialog } from "~/story";
import { Dialogue } from "./Dialogue";
import "./ui.css";
import "./speakers.css";
import { RPG } from "./RPG";
import { shouldShowCombat } from "~/rpg/combat";
import { signal } from "@preact/signals";

const uiContainer = document.getElementById("ui")!;

if (!uiContainer) {
    throw new Error("missing required #ui element");
}

export const showingCredits = signal(false);

function UI() {
    const [isTitleScreen, setIsTitleScreen] = useState(true);

    if (isTitleScreen) {
        return (
            <div id="titleScreen" onClick={() => setIsTitleScreen(false)}>
                <span className="title1">CASSIE'S</span>
                <div id="logo" />
                <span className="title2">TRUCK</span>
            </div>
        );
    }

    if (showingCredits.value) {
        return (
            <div id="titleScreen">
                <h2>Thanks for playing!</h2>
                <section>
                    Programming and design by <a href="https://tom.shea.at">Thristhart</a> and{" "}
                    <a href="https://ldjam.com/users/Zyrconium">Zyrconium</a>
                </section>
                <section>
                    Writing and audio by <a href="https://itslauragpo.tumblr.com/">LGPO</a>
                </section>
                <p>
                    Thanks to the BBC for the use of these samples:
                    <ul>
                        <li>
                            <a href="https://sound-effects.bbcrewind.co.uk/search?q=07043054">
                                https://sound-effects.bbcrewind.co.uk/search?q=07043054
                            </a>
                        </li>
                        <li>
                            <a href="https://sound-effects.bbcrewind.co.uk/search?q=07042177">
                                https://sound-effects.bbcrewind.co.uk/search?q=07042177
                            </a>
                        </li>
                        <li>
                            <a href="https://sound-effects.bbcrewind.co.uk/search?q=07030094">
                                https://sound-effects.bbcrewind.co.uk/search?q=07030094
                            </a>
                        </li>
                        <li>
                            <a href="https://sound-effects.bbcrewind.co.uk/search?q=07045258">
                                https://sound-effects.bbcrewind.co.uk/search?q=07045258
                            </a>
                        </li>
                        <li>
                            <a href="https://sound-effects.bbcrewind.co.uk/search?q=07019055">
                                https://sound-effects.bbcrewind.co.uk/search?q=07019055
                            </a>
                        </li>
                    </ul>
                    bbc.co.uk – © copyright 2023 BBC
                </p>
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
