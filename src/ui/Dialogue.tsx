import nyaSound from "~/assets/audio/nya.mp3";
import zSound from "~/assets/audio/z.mp3";
import {
    continueStory,
    getCurrentBeat,
    getCurrentChoices,
    getCurrentSpeakers,
    getStoryDecoratorsClassName,
    selectChoice,
    Speaker,
    StoryBeat,
    StoryChoices,
    StoryMessage,
} from "~/story";
import { usePrevious } from "~/util/usePrevious";
import cx from "classnames";
import { Howl } from "howler";
import { useEffect, useMemo, useState } from "preact/hooks";
import "./Dialogue.css";
import { renderUI } from "./ui";

function getSpeakerName(speaker: Speaker) {
    switch (speaker) {
        case "cat":
        case "cattruck":
            return "Cassie";
        case "frog":
            return "Tony";
        case "bear":
            return "Walker";
        default:
            return speaker;
    }
}

function formatCharForDisplay(char: string) {
    if (char === " ") {
        return <>&nbsp;</>;
    }
    return char;
}

function isEndOfSentence(index: number, text: string) {
    const char = text[index];
    const nextChar = text[index + 1];
    if (nextChar === " " || nextChar === undefined) {
        switch (char) {
            case ".":
            case "!":
            case "?":
            case ",":
            case '"':
                return true;
        }
    }
    return false;
}

function getDurationForCharacter(index: number, text: string) {
    const char = text[index];
    if (isEndOfSentence(index, text)) {
        return 300;
    }
    switch (char) {
        case " ":
            return 60;
        default:
            return 30;
    }
}

const basicSpeechSound = new Howl({
    src: [zSound],
});

const catSpeechSound = new Howl({
    src: [nyaSound],
});

interface SpeechConfig {
    readonly baseRate: number;
    readonly sound: Howl;
}
function getSpeechConfigForSpeaker(speaker: Speaker): SpeechConfig | null {
    switch (speaker) {
        case "none":
            return null;
        case "cat":
        case "cattruck":
            return { baseRate: 0.9, sound: catSpeechSound };
        case "rat":
            return { baseRate: 0.7, sound: basicSpeechSound };
        case "bear":
            return { baseRate: 0.3, sound: basicSpeechSound };
        case "frog":
            return { baseRate: 0.6, sound: basicSpeechSound };
        case "cop":
            return { baseRate: 0.4, sound: basicSpeechSound };
        case "clown":
            return { baseRate: 0.8, sound: basicSpeechSound };
        case "leslie":
            return { baseRate: 0.5, sound: basicSpeechSound };
    }
}

function playSoundForChar(char: string, speaker: Speaker, side: "left" | "right" | "none") {
    if (!char || char === " ") {
        return;
    }
    switch (char) {
        case ".":
        case "!":
        case "?":
        case ",":
        case '"':
            return;
        default:
            const speechConfig = getSpeechConfigForSpeaker(speaker);
            if (!speechConfig) {
                return;
            }
            speechConfig.sound.rate(speechConfig.baseRate + Math.random() * 0.1);
            let x = 0;
            if (side === "left") {
                x = -0.5;
            }
            if (side === "right") {
                x = 0.5;
            }
            speechConfig.sound.pos(x, 0.5, -0.5);
            speechConfig.sound.play();
            break;
    }
}

let isAnimatingText = false;
let shouldSkip = false;

interface TypeWriterProps {
    readonly text: string;
    readonly skip: boolean;
    readonly speaker: Speaker;
    readonly side: "left" | "right" | "none";
}
function TypeWriter({ text, skip, speaker, side }: TypeWriterProps) {
    const [visibleLetter, setVisibleLetter] = useState(0);
    const words = useMemo(() => text.split(" "), [text]);

    const prevText = usePrevious(text);
    if (text !== prevText) {
        setVisibleLetter(0);
        playSoundForChar(text[0], speaker, side);
    }

    useEffect(() => {
        let lastLetterTime: number;
        const frame = (timestamp: number) => {
            if (!lastLetterTime) {
                lastLetterTime = timestamp;
            }
            if (skip || visibleLetter >= text.length) {
                isAnimatingText = false;
                return;
            }
            animationFrame = requestAnimationFrame(frame);
            if (timestamp - lastLetterTime > getDurationForCharacter(visibleLetter, text)) {
                lastLetterTime = timestamp;
                playSoundForChar(text[visibleLetter + 1], speaker, side);
                setVisibleLetter(visibleLetter + 1);
            }
        };
        let animationFrame = requestAnimationFrame(frame);
        isAnimatingText = true;
        return () => cancelAnimationFrame(animationFrame);
    }, [visibleLetter, skip]);

    let charIndex = 0;
    return (
        <>
            {words.map(
                (word, wordIndex) =>
                    ++charIndex && (
                        <span key={wordIndex} className={wordIndex < words.length - 1 ? "addSpace" : undefined}>
                            {word.split("").map((char, wordCharIndex) => (
                                <span
                                    className={!skip && visibleLetter < charIndex++ - 1 ? "hiddenCharacter" : undefined}
                                    key={wordCharIndex}>
                                    {formatCharForDisplay(char)}
                                </span>
                            ))}
                        </span>
                    )
            )}
        </>
    );
}

interface DialogueMessageProps {
    readonly storyMessage: StoryMessage;
}
const DialogueMessage = ({ storyMessage }: DialogueMessageProps) => {
    const { message, speaker, isNarration } = storyMessage;
    const currentSpeakers = getCurrentSpeakers();
    const currentChoices = getCurrentChoices();

    return (
        <div className={cx("message", speaker, isNarration && "narration")}>
            <Speakers />
            {currentChoices && <DialogueChoices storyChoices={currentChoices} />}
            {speaker !== "none" && (
                <span className={cx("speaker", speaker === currentSpeakers[1] && "speakertag-right")}>
                    {getSpeakerName(speaker)}
                </span>
            )}
            <span className="messageText">
                <TypeWriter
                    text={message}
                    skip={shouldSkip}
                    speaker={speaker}
                    side={speaker === currentSpeakers[0] ? "left" : speaker === currentSpeakers[1] ? "right" : "none"}
                />
            </span>
        </div>
    );
};

interface DialogueChoicesProps {
    readonly storyChoices: StoryChoices;
}
const DialogueChoices = ({ storyChoices }: DialogueChoicesProps) => {
    return (
        <ul className="choices">
            {storyChoices.choices.map(({ speaker, message, index }) => (
                <li key={index}>
                    <button
                        className={cx("choice", speaker)}
                        onClick={(event) => {
                            selectChoice(index);
                            event.stopPropagation();
                        }}>
                        {message}
                    </button>
                </li>
            ))}
        </ul>
    );
};
interface StoryBeatProps {
    readonly storyBeat: StoryBeat | undefined;
}
const Beat = ({ storyBeat }: StoryBeatProps) => {
    if (!storyBeat) {
        return null;
    }
    switch (storyBeat.type) {
        case "message":
            return <DialogueMessage storyMessage={storyBeat} />;
    }
};

const Speakers = () => {
    const speakers = getCurrentSpeakers();
    return (
        <>
            {speakers[0] && <div className={cx("speaker-portrait", "left-speaker", speakers[0])} />}
            {speakers[1] && <div className={cx("speaker-portrait", "right-speaker", speakers[1])} />}
        </>
    );
};

export const Dialogue = () => {
    const storyBeat = getCurrentBeat();

    return (
        <div
            className={getStoryDecoratorsClassName()}
            id="dialogue"
            onClick={() => {
                if (isAnimatingText) {
                    shouldSkip = true;
                    renderUI();
                } else {
                    shouldSkip = false;
                    continueStory();
                }
            }}>
            <Beat storyBeat={storyBeat} />
        </div>
    );
};
