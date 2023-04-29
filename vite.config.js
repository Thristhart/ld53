import path from "path";
import { defineConfig } from "vite";
import viteInkPlugin from "./vite-ink-plugin";
import preact from "@preact/preset-vite";

export default defineConfig({
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "src"),
        },
    },
    plugins: [preact(), viteInkPlugin()],
    base: "/ld53/",
});
