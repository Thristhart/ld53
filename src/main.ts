import { continueStory } from "~/story";
import { renderUI } from "~/ui/ui";
import "./style.css";

if (import.meta.hot) {
    import.meta.hot.accept();
}

renderUI();

continueStory();
