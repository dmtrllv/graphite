import { Project } from "./project";
import { ProjectInfo } from "./project";
import type { ProjectManager } from "./project-manager";
import { Settings } from "./settings";

export interface SerializedProject {
	version: number;
	project: {
		name: string;
	};
	data: Record<string, unknown>;
}

export const serializeProject = (project: Project): SerializedProject => ({
	version: 1,
	project: {
		name: project.info.name
	},
	data: project.serialize()
});

export const deserializeProject = (manager: ProjectManager, json: SerializedProject, lastSave: string, settings: Settings): Project => {
	if (json.version !== 1)
		throw new Error(`Unsupported project version '${json.version}'.`);

	const info = new ProjectInfo();
	info.name = json.project.name;
	info.lastSave = lastSave;

	return Project.deserialize(json.data, { manager, info, settings });
};