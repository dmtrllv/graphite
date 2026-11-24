export class Group {
	public readonly id: number;
	public readonly nodes: number[];
	public readonly groups: Group[];
	
	public get type() {
		return this.constructor.name;
	}

	public constructor(id: number, nodes: number[] = [], groups: Group[] = []) {
		this.id = id;
		this.nodes = nodes;
		this.groups = groups;
	}
}