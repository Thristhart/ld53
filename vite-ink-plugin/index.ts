import { exec } from "child_process";
import { readFile, unlink } from "fs/promises";
import path from "path";
import util from "util";
import { PluginOption } from "vite";

const fileRegex = /\.(ink)$/;

const execPromise = util.promisify(exec);

export default function viteInkPlugin(): PluginOption {
    return {
        name: "ink",

        async load(id) {
            if (fileRegex.test(id)) {
                const result = await execPromise(`${path.join(__dirname, "inklecate")} ${id}`);
                if (result.stderr) {
                    throw new Error(result.stderr);
                }

                const jsonPath = `${id}.json`;

                const jsonString = await readFile(jsonPath);

                try {
                    await unlink(jsonPath);
                } catch (e) {}

                return {
                    code: `export default ${jsonString};`,
                    map: null,
                };
            }
            return undefined;
        },
    };
}
