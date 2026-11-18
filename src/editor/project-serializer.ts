import { Project } from "./project";
import { ProjectInfo } from "./project";
import type { ProjectManager } from "./project-manager";
import { Settings } from "./settings";
import { serializeGraphManager, deserializeGraphManager, type SerializedGraphManager } from "../graph";

export interface SerializedProject {
	version: number;
	project: {
		name: string;
	};
	settings: Record<string, unknown>;
	graphManager: SerializedGraphManager;
}

export const serializeProject = (project: Project): SerializedProject => {
	return {
		version: 1,
		project: {
			name: project.info.name
		},
		settings: {},
		graphManager: serializeGraphManager(project.graphManager)
	};
};

export const deserializeProject = (manager: ProjectManager, json: SerializedProject): Project => {
	if (json.version !== 1)
		throw new Error(`Unsupported project version '${json.version}'.`);

	if (!json.project || typeof json.project.name !== "string")
		throw new Error("Invalid project information.");

	if (!json.graphManager || !Array.isArray(json.graphManager.graphs))
		throw new Error("Invalid graph manager data.");

	const info = new ProjectInfo(json.project.name);
	const settings = new Settings();
	const graphManager = deserializeGraphManager(json.graphManager);

	return new Project(manager, info, settings, graphManager);
};
