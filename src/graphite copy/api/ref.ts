import type { GraphManager } from "../manager";

export abstract class Ref<T> {
	protected readonly manager: GraphManager;
	protected readonly data: T;

	public constructor(manager: GraphManager, data: T) {
		this.manager = manager;
		this.data = data;
	}

	public equals(other: this): boolean {
		return this.data === other.data;
	}
}
