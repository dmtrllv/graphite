import { observable } from "./observable";
import { createEvent, dispatchBeforeChange, dispatchChange, ensureState, removeChild, setChild, syncChildren } from "./state";

const OBJECT_IDS = new WeakMap<object, number>();
const SYMBOL_IDS = new Map<symbol, number>();
let nextIdentity = 0;

const identitySegment = (value: unknown): string => {
	if (typeof value === "object" && value !== null) {
		let id = OBJECT_IDS.get(value);

		if (!id) {
			id = ++nextIdentity;
			OBJECT_IDS.set(value, id);
		}

		return `object:${id}`;
	}

	if (typeof value === "symbol") {
		let id = SYMBOL_IDS.get(value);

		if (!id) {
			id = ++nextIdentity;
			SYMBOL_IDS.set(value, id);
		}

		return `symbol:${id}`;
	}

	return `${typeof value}:${String(value)}`;
};

const mapSegment = (key: unknown): string => `[${identitySegment(key)}]`;
const setSegment = (value: unknown): string => `[${identitySegment(value)}]`;

@observable
export class ObservableMap<K, V> implements Iterable<[K, V]> {
	private readonly items = new Map<K, V>();

	public constructor(entries?: Iterable<readonly [K, V]> | null) {
		ensureState(this);

		if (entries)
			for (const [key, value] of entries)
				this.set(key, value);
	}

	public get size(): number {
		return this.items.size;
	}

	public get(key: K): V | undefined {
		return this.items.get(key);
	}

	public has(key: K): boolean {
		return this.items.has(key);
	}

	public set(key: K, value: V): this {
		const exists = this.items.has(key);
		const previous = this.items.get(key);

		if (exists && Object.is(previous, value))
			return this;

		const event = createEvent(this, "set", previous, value, {
			type: "map:set",
			key
		});

		if (!dispatchBeforeChange(this, event))
			return this;

		this.items.set(key, value);
		setChild(this, mapSegment(key), value);
		dispatchChange(this, event);

		return this;
	}

	public delete(key: K): boolean {
		if (!this.items.has(key))
			return false;

		const previous = this.items.get(key);
		const event = createEvent(this, "delete", previous, undefined, {
			type: "map:delete",
			key
		});

		if (!dispatchBeforeChange(this, event))
			return false;

		this.items.delete(key);
		removeChild(this, mapSegment(key));
		dispatchChange(this, event);

		return true;
	}

	public clear(): void {
		if (!this.items.size)
			return;

		const previous = new Map(this.items);
		const event = createEvent(this, "clear", previous, undefined, {
			type: "map:clear"
		});

		if (!dispatchBeforeChange(this, event))
			return;

		this.items.clear();
		syncChildren(this, []);
		dispatchChange(this, event);
	}

	public keys(): MapIterator<K> {
		return this.items.keys();
	}

	public values(): MapIterator<V> {
		return this.items.values();
	}

	public entries(): MapIterator<[K, V]> {
		return this.items.entries();
	}

	public forEach(callback: (value: V, key: K, map: this) => void, thisArg?: unknown): void {
		this.items.forEach((value, key) => callback.call(thisArg, value, key, this));
	}

	public [Symbol.iterator](): MapIterator<[K, V]> {
		return this.items[Symbol.iterator]();
	}
}

@observable
export class ObservableSet<T> implements Iterable<T> {
	private readonly items = new Set<T>();

	public constructor(values?: Iterable<T> | null) {
		ensureState(this);

		if (values)
			for (const value of values)
				this.add(value);
	}

	public get size(): number {
		return this.items.size;
	}

	public has(value: T): boolean {
		return this.items.has(value);
	}

	public add(value: T): this {
		if (this.items.has(value))
			return this;

		const event = createEvent(this, "add", undefined, value, {
			type: "set:add",
			value
		});

		if (!dispatchBeforeChange(this, event))
			return this;

		this.items.add(value);
		setChild(this, setSegment(value), value);
		dispatchChange(this, event);

		return this;
	}

	public delete(value: T): boolean {
		if (!this.items.has(value))
			return false;

		const event = createEvent(this, "delete", value, undefined, {
			type: "set:delete",
			value
		});

		if (!dispatchBeforeChange(this, event))
			return false;

		this.items.delete(value);
		removeChild(this, setSegment(value));
		dispatchChange(this, event);

		return true;
	}

	public clear(): void {
		if (!this.items.size)
			return;

		const previous = new Set(this.items);
		const event = createEvent(this, "clear", previous, undefined, {
			type: "set:clear"
		});

		if (!dispatchBeforeChange(this, event))
			return;

		this.items.clear();
		syncChildren(this, []);
		dispatchChange(this, event);
	}

	public keys(): SetIterator<T> {
		return this.items.keys();
	}

	public values(): SetIterator<T> {
		return this.items.values();
	}

	public entries(): SetIterator<[T, T]> {
		return this.items.entries();
	}

	public forEach(callback: (value: T, value2: T, set: this) => void, thisArg?: unknown): void {
		this.items.forEach(value => callback.call(thisArg, value, value, this));
	}

	public [Symbol.iterator](): SetIterator<T> {
		return this.items[Symbol.iterator]();
	}
}

@observable
export class ObservableArray<T> implements Iterable<T> {
	private readonly items: T[] = [];

	public constructor(values?: Iterable<T>) {
		ensureState(this);

		if (values)
			this.items.push(...values);

		this.syncItems();
	}

	public get length(): number {
		return this.items.length;
	}

	public at(index: number): T | undefined {
		return this.items.at(index);
	}

	public get(index: number): T | undefined {
		return this.items[index];
	}

	public set(index: number, value: T): void {
		if (!Number.isInteger(index) || index < 0 || index >= this.items.length)
			throw new RangeError(`Index ${index} is out of range!`);

		const previous = this.items[index];

		if (Object.is(previous, value))
			return;

		const event = createEvent(this, "set", previous, value, {
			type: "array:set",
			index
		});

		if (!dispatchBeforeChange(this, event))
			return;

		this.items[index] = value;
		this.syncItems();
		dispatchChange(this, event);
	}

	public push(...values: T[]): number {
		if (!values.length)
			return this.items.length;

		const event = createEvent(this, "push", undefined, values, {
			type: "array:push",
			count: values.length
		});

		if (!dispatchBeforeChange(this, event))
			return this.items.length;

		this.items.push(...values);
		this.syncItems();
		dispatchChange(this, event);

		return this.items.length;
	}

	public pop(): T | undefined {
		if (!this.items.length)
			return undefined;

		const previous = this.items.at(-1);
		const event = createEvent(this, "pop", previous, undefined, {
			type: "array:pop"
		});

		if (!dispatchBeforeChange(this, event))
			return undefined;

		this.items.pop();
		this.syncItems();
		dispatchChange(this, event);

		return previous;
	}

	public unshift(...values: T[]): number {
		if (!values.length)
			return this.items.length;

		const event = createEvent(this, "unshift", undefined, values, {
			type: "array:unshift",
			count: values.length
		});

		if (!dispatchBeforeChange(this, event))
			return this.items.length;

		this.items.unshift(...values);
		this.syncItems();
		dispatchChange(this, event);

		return this.items.length;
	}

	public shift(): T | undefined {
		if (!this.items.length)
			return undefined;

		const previous = this.items[0];
		const event = createEvent(this, "shift", previous, undefined, {
			type: "array:shift"
		});

		if (!dispatchBeforeChange(this, event))
			return undefined;

		this.items.shift();
		this.syncItems();
		dispatchChange(this, event);

		return previous;
	}

	public splice(start: number, deleteCount?: number, ...values: T[]): T[] {
		const previous = this.items.slice();
		const removed = this.items.slice(start, deleteCount === undefined ? undefined : start + deleteCount);

		if (!removed.length && !values.length)
			return [];

		const event = createEvent(this, "splice", previous, values, {
			type: "array:splice",
			start,
			deleteCount: deleteCount ?? this.items.length - start,
			insertCount: values.length
		});

		if (!dispatchBeforeChange(this, event))
			return [];

		const result = this.items.splice(start, deleteCount ?? this.items.length - start, ...values);

		this.syncItems();
		dispatchChange(this, event);

		return result;
	}

	public reverse(): this {
		if (this.items.length < 2)
			return this;

		const previous = this.items.slice();
		const event = createEvent(this, "reverse", previous, undefined, {
			type: "array:reverse"
		});

		if (!dispatchBeforeChange(this, event))
			return this;

		this.items.reverse();
		this.syncItems();
		dispatchChange(this, event);

		return this;
	}

	public sort(compareFn?: (a: T, b: T) => number): this {
		if (this.items.length < 2)
			return this;

		const previous = this.items.slice();
		const event = createEvent(this, "sort", previous, undefined, {
			type: "array:sort"
		});

		if (!dispatchBeforeChange(this, event))
			return this;

		this.items.sort(compareFn);
		this.syncItems();
		dispatchChange(this, event);

		return this;
	}

	public clear(): void {
		if (!this.items.length)
			return;

		const previous = this.items.slice();
		const event = createEvent(this, "clear", previous, undefined, {
			type: "array:clear"
		});

		if (!dispatchBeforeChange(this, event))
			return;

		this.items.length = 0;
		this.syncItems();
		dispatchChange(this, event);
	}

	public includes(value: T): boolean {
		return this.items.includes(value);
	}

	public indexOf(value: T): number {
		return this.items.indexOf(value);
	}

	public find(callback: (value: T, index: number, array: T[]) => unknown): T | undefined {
		return this.items.find(callback);
	}

	public findIndex(callback: (value: T, index: number, array: T[]) => unknown): number {
		return this.items.findIndex(callback);
	}

	public map<U>(callback: (value: T, index: number, array: T[]) => U): U[] {
		return this.items.map(callback);
	}

	public filter(callback: (value: T, index: number, array: T[]) => unknown): T[] {
		return this.items.filter(callback);
	}

	public forEach(callback: (value: T, index: number, array: T[]) => void): void {
		this.items.forEach(callback);
	}

	public slice(start?: number, end?: number): T[] {
		return this.items.slice(start, end);
	}

	public toArray(): T[] {
		return this.items.slice();
	}

	public [Symbol.iterator](): ArrayIterator<T> {
		return this.items[Symbol.iterator]();
	}

	private syncItems(): void {
		syncChildren(this, this.items.map((value, index) => [String(index), value] as const));
	}
}
