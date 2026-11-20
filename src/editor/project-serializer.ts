import { Project } from "./project";
import { ProjectInfo } from "./project";
import type { ProjectManager } from "./project-manager";
import { Settings } from "./settings";

export interface SerializedProject {
	version: number;
	project: {
		name: string;
	};
	data: Record<string, any>;
}

const CURRENT_VERSION = 1;

const migrateProject = (json: SerializedProject): SerializedProject => {
	if (json.version > CURRENT_VERSION)
		throw new Error(`Project version '${json.version}' is newer than supported version '${CURRENT_VERSION}'.`);

	if (json.version !== CURRENT_VERSION)
		throw new Error(`Unsupported project version '${json.version}'.`);

	return json;
};

export const serializeProject = (project: Project): SerializedProject => ({
	version: CURRENT_VERSION,
	project: {
		name: project.info.name
	},
	data: project.serialize()
});

export const deserializeProject = (manager: ProjectManager, json: SerializedProject, lastSave: string, settings: Settings): Project => {
	const validated = migrateProject(json);
	const info = new ProjectInfo();

	info.name = validated.project.name;
	info.lastSave = lastSave;

	return Project.deserialize(validated.data, { manager, info, settings });
};