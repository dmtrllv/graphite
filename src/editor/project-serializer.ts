import { Project } from "./project";
import { ProjectInfo } from "./project";
import type { ProjectManager } from "./project-manager";
import { Settings } from "./settings";
import { serializeGraphManager, deserializeGraphManager, type SerializedGraphManager } from "./graph";
import { serializeSimulationManager, deserializeSimulationManager, type SerializedSimulationManager } from "./simulation";

export interface SerializedProject {
	version: number;
	project: {
		name: string;
	};
	graphManager: SerializedGraphManager;
	simulationManager?: SerializedSimulationManager;
}

export const serializeProject = (project: Project): SerializedProject => {
	return {
		version: 2,
		project: {
			name: project.info.name
		},
		graphManager: serializeGraphManager(project.graphManager),
		simulationManager: serializeSimulationManager(project.simulationManager)
	};
};

export const deserializeProject = (manager: ProjectManager, json: SerializedProject, lastSave: string, settings: Settings): Project => {
	if (json.version !== 1 && json.version !== 2)
		throw new Error(`Unsupported project version '${json.version}'.`);

	if (!json.project || typeof json.project.name !== "string")
		throw new Error("Invalid project information.");

	if (!json.graphManager || !Array.isArray(json.graphManager.graphs))
		throw new Error("Invalid graph manager data.");

	const info = ProjectInfo.deserialize({ name: json.project.name, lastSave });
	const graphManager = deserializeGraphManager(json.graphManager);

	const simulationManager = json.simulationManager
		? deserializeSimulationManager(json.simulationManager, graphManager)
		: undefined;

	return new Project({}, manager, info, settings, graphManager, simulationManager);
};
