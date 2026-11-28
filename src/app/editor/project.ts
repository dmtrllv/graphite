import type { Graphite } from "@graphite";
import type { UUID } from "@utils";

export class Project {
	public readonly id: UUID;
	public readonly info: ProjectInfo;
	public readonly graphs: Graphite;

	public constructor(id: UUID, info: ProjectInfo, graphs: Graphite) {
		this.id = id;
		this.info = info;
		this.graphs = graphs;
	}
}

export type ProjectInfo = {
	readonly id: UUID;
	readonly name: string;
	readonly created: string;
	readonly saved: string;
};