import react from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		react(),
		babel({
			presets: [{
				preset: () => ({
					plugins: [
						["@babel/plugin-proposal-decorators", {
							version: "2023-11"
						}]
					]
				}),
				rolldown: {
					filter: { code: "@" }
				}
			}]
		}),
		{
			name: "full-reload",
			handleHotUpdate({ server }) {
				server.ws.send({ type: "full-reload" });
				return [];
			},
		}
	],
})
