import { assert } from "./assert";

export class Allocator<T extends {}> {
	private readonly items: (T | undefined)[] = [];
	private readonly freeList: number[] = [];

	public readonly type: ObjectConstructor<T>;

	public constructor(type: ObjectConstructor<T>) {
		this.type = type;
	}

	private nextId() {
		if (this.freeList.length > 0)
			return this.freeList.pop()!;
		return this.items.length;
	}

	public allocWithId<U extends new (id: number, ...args: Args) => T, Args extends any[]>(type: U, ...args: Args): InstanceType<U> {
		assert(() => type === this.type || type.prototype instanceof this.type, `type ${type.name} does not extend ${this.type.name}!`);
		const id = this.nextId();
		const item = new type(id, ...args) as InstanceType<U>;
		this.items[id] = item;
		return item;
	}

	public alloc<U extends new (...args: any[]) => T>(type: U, ...args: ConstructorParameters<U>): [number, InstanceType<U>] {
		assert(() => type === this.type || type.prototype instanceof this.type, `type ${type.name} does not extend ${this.type.name}!`);
		const id = this.nextId();
		const item = new type(...args) as InstanceType<U>;
		this.items[id] = item;
		return [id, item];
	}

	public allocAt<U extends new (...args: any[]) => T>(id: number, type: U, ...args: ConstructorParameters<U>): [number, InstanceType<U>] {
		assert(() => type === this.type || type.prototype instanceof this.type, `type ${type.name} does not extend ${this.type.name}!`);
		const freeIndex = this.freeList.indexOf(id);
		
		if (freeIndex > -1)
			this.freeList.splice(freeIndex, 1);

		for(let i = this.nextId(); i < id; i++)
			this.freeList.push(i);

		const item = new type(...args) as InstanceType<U>;
		this.items[id] = item;
		return [id, item];
	}

	public get(id: number): T | undefined {
		return this.items[id];
	}

	public free(id: number): void {
		if (id < 0 || id >= this.items.length || this.items[id] === undefined)
			return;

		this.items[id] = undefined;
		this.freeList.push(id);
	}

	public *iter(): IterableIterator<T> {
		for (const item of this.items) {
			if (item !== undefined)
				yield item;
		}
	}

	public all() {
		return Array.from(this.iter());
	}

	public includes(item: T) {
		return this.items.includes(item);
	}

}

type ObjectConstructor<T extends object, Args extends any[] = any[]> = (new (...args: Args) => T) | (abstract new (...args: Args) => T)

export type WithoutIDParams<T> = T extends new (id: number, ...args: infer Args) => any ? Args : never;