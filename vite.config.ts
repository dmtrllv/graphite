import react from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig, type Plugin } from "vite";

const fullReloadPlugin = (): Plugin => ({
	name: "full-reload",
	handleHotUpdate({ server }) {
		server.ws.send({ type: "full-reload" });
		return [];
	},
});

export default defineConfig({
	plugins: [
		fullReloadPlugin(),
		react({
			include: "**/*.{tsx,jsx}",
		}),
		babel({
			presets: [{
				preset: () => ({
					plugins: [
						["@babel/plugin-transform-typescript", {
							allowDeclareFields: true
						}],
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
	],
	resolve: {
		tsconfigPaths: true
	}
})
