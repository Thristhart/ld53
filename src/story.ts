import storyContent from "~/ink/main.ink";
import { combats, endCombat, startCombat } from "~/rpg/combat";
import { renderUI } from "~/ui/ui";
import { Story } from "inkjs/engine/Story";
import { BoolValue, StringValue } from "inkjs/engine/Value";

let story = new Story(storyContent);

if (import.meta.env.DEV) {
    //@ts-ignore
    window.DEBUG_STORY = story;
}

export type Speaker = "none" | "cat";

export interface StoryMessage {
    readonly type: "message";
    readonly speaker: Speaker;
    readonly message: string;
    readonly isNarration: boolean;
}
export interface StoryChoice {
    readonly speaker: Speaker;
    readonly message: string;
    readonly index: number;
}
export interface StoryChoices {
    readonly type: "choices";
    readonly choices: StoryChoice[];
}

export type StoryBeat = StoryMessage;

const log: StoryBeat[] = [];
const speakers: [Speaker?, Speaker?] = [];

const SPEAKER_REGEX = /(\w+)(\$?):\s?(.*)/;

function getSpeaker(text: string) {
    let speaker: Speaker = "none";
    let isNarration = true;

    let message = text;

    const match = message.match(SPEAKER_REGEX);
    if (match) {
        speaker = match[1] as Speaker;
        isNarration = !!match[2];
        message = match[3];
    }
    return { speaker, message, isNarration };
}

function parseCurrentText() {
    const current = story.currentText;
    if (!current) {
        return;
    }
    if (story.currentTags && story.currentTags.length !== 0) {
        story.currentTags.forEach((tag) => {
            if (tag.startsWith("speaking:")) {
                const newSpeakers = tag
                    .split("speaking:")[1]
                    .split(",")
                    .map((speaker) => (speaker === "" ? undefined : speaker));
                speakers[0] = newSpeakers[0] as Speaker;
                speakers[1] = newSpeakers[1] as Speaker;
            }
            if (tag.startsWith("bg:")) {
                const newBg = tag.split("bg:")[1];
                document.body.dataset.bg = newBg;
            }
        });
    }
    const currentSpeaker = getSpeaker(current);
    if (currentSpeaker.speaker !== "none" && !speakers.includes(currentSpeaker.speaker)) {
        if (speakers[0]) {
            speakers[1] = currentSpeaker.speaker;
        } else {
            speakers[0] = currentSpeaker.speaker;
        }
    }
    log.push({ ...currentSpeaker, type: "message" });
}

let currentChoices: StoryChoices | undefined;

export const getCurrentBeat = (): StoryBeat | undefined => log[log.length - 1];
export const getCurrentSpeakers = () => speakers;
export const getCurrentChoices = () => currentChoices;

export const continueStory = () => {
    let didContinue = false;
    if (story.canContinue) {
        story.Continue();
        parseCurrentText();
        didContinue = true;
    } else if (story.currentChoices.length > 0 && !currentChoices) {
        currentChoices = {
            type: "choices",
            choices: story.currentChoices.map((choice) => ({ ...getSpeaker(choice.text), index: choice.index })),
        };
        didContinue = true;
    }
    renderUI();
    return didContinue;
};
export const selectChoice = (choiceIndex: number) => {
    story.ChooseChoiceIndex(choiceIndex);
    currentChoices = undefined;
    continueStory();
};

export const shouldShowDialog = () => getStoryBool("shouldShowDialog");

export const hideDialog = () => setStoryBool("shouldShowDialog", false);

export const showDialog = () => setStoryBool("shouldShowDialog", true);

export function getStoryBool(name: string) {
    return (story.variablesState.GetVariableWithName(name) as BoolValue).value;
}
export function setStoryBool(name: string, value: boolean) {
    story.variablesState.SetGlobal(name, new BoolValue(value));
}

// function getDecoratorClass(name: string) {
//     return getStoryBool(name) && name;
// }

export const getStoryDecoratorsClassName = () => "";

story.ObserveVariable("combat", (_, value: keyof typeof combats) => {
    if (value === "none") {
        endCombat();
    } else {
        startCombat(value);
    }
});

if (import.meta.hot) {
    import.meta.hot.accept();
    import.meta.hot.accept("/src/ink/main.ink", (main) => {
        const saveStateJSON = story.state.toJson();
        const newStory = new Story(main!.default);
        newStory.state.LoadJson(saveStateJSON);
        story = newStory;
        //@ts-ignore
        window.DEBUG_STORY = story;
    });
}

export function save() {
    localStorage.setItem("save", story.state.ToJson());
}
export function load() {
    const saveData = localStorage.getItem("save");
    if (saveData) {
        story.state.LoadJson(saveData);
    }
    const combat = story.variablesState.GetVariableWithName("combat");
    if (combat instanceof StringValue) {
        if (combat.value !== "none") {
            startCombat(combat.value as keyof typeof combats);
        }
    }
    renderUI();
}
//@ts-ignore
window.DEBUG_SAVE = save;
//@ts-ignore
window.DEBUG_LOAD = load;
