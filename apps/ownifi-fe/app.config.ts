import { defineConfig } from "@solidjs/start/config";
import devtools from 'solid-devtools/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    vite: {
        plugins: [
            tailwindcss(),
            devtools({
                autoname: true,
                locator: {
                    targetIDE: 'vscode',
                    componentLocation: true,
                    jsxLocation: true,
                },
            }),
        ],
    },
});
