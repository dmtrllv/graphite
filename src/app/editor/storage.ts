import { assert } from "@utils";

export class Storage<T extends {}> {
	public readonly id: string;

	private readonly subStorages: Map<string, Storage<any>>;
	private readonly keys: Set<string>;
	private readonly keysId: string;
	private readonly subStoragesId: string;

	public constructor(id: string) {
		this.id = id;
		this.keysId = `${id}_KEYS`;
		this.subStoragesId = `${id}_SUB_STORAGES`;
		this.keys = new Set(JSON.parse(localStorage.getItem(this.keysId) || "[]"));

		const subStorageKeys: string[] = JSON.parse(localStorage.getItem(this.subStoragesId) || "[]");
		this.subStorages = new Map();
		subStorageKeys.forEach(storage => this.subStorages.set(storage, new Storage(`${id}.${storage}`)));
	}

	private syncSubStorages() {
		localStorage.setItem(this.subStoragesId, JSON.stringify(Array.from(this.keys)));
	}

	private syncKeys() {
		localStorage.setItem(this.keysId, JSON.stringify(Array.from(this.keys)));
	}

	private addKey(key: string) {
		this.keys.add(key.toString());
		this.syncKeys();
	}

	private removeKey(key: string) {
		this.keys.delete(key.toString());
		this.syncKeys();
	}

	private clearKeys() {
		this.keys.clear();
		this.syncKeys();
	}

	public subStorage<T extends {}>(name: string): Storage<T> {
		if (!this.subStorages.has(name)) {
			this.subStorages.set(name, new Storage(`${this.id}.${name}`));
			this.syncSubStorages();
		}
		return this.subStorages.get(name) as Storage<T>;
	}

	public removeSubStorage(name: string) {
		const storage = this.subStorages.get(name);
		if (storage) {
			storage.clear(true);
			this.subStorages.delete(name);
			this.syncSubStorages();
		}
	}

	public get<K extends keyof T>(key: K): T[K] {
		const k = `${this.id}.${key.toString()}`;
		this.addKey(k);
		const val = assert.notNull(localStorage.getItem(k));
		return JSON.parse(val);
	}

	public getOr<K extends keyof T>(key: K, value: T[K]): T[K] {
		const k = `${this.id}.${key.toString()}`;
		this.addKey(k);
		const val = localStorage.getItem(k);
		if (!val) {
			localStorage.setItem(k, JSON.stringify(value));
			return value;
		}
		return JSON.parse(val);
	}

	public getOrInsert<K extends keyof T>(key: K, insertCallback: (key: keyof T) => T[K]): T[K] {
		const k = `${this.id}.${key.toString()}`;
		this.addKey(k);
		const val = localStorage.getItem(k);
		if (!val) {
			const val = insertCallback(key);
			localStorage.setItem(k, JSON.stringify(val));
			return val;
		}
		return JSON.parse(val);
	}

	public set<K extends keyof T>(key: K, value: T[K]): this {
		const k = `${this.id}.${key.toString()}`;
		this.addKey(k);
		localStorage.setItem(k, JSON.stringify(value));
		return this;
	}

	public delete(key: keyof T) {
		const k = `${this.id}.${key.toString()}`;
		this.removeKey(k);
		localStorage.removeItem(k);
	}

	public clear(recursive: boolean = false) {
		this.keys.forEach(localStorage.removeItem);
		this.clearKeys();
		if (recursive) {
			this.subStorages.forEach((s) => s.clear(true));
			this.subStorages.clear();
			this.syncSubStorages();
		}
	}
}