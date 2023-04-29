import path from "path";

export default {
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "src"),
        },
    },
    plugins: [],
    base: "/ld53/",
};