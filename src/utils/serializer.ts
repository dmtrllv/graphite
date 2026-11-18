
type Constructor<T extends object = object> = new (...args: any[]) => T;

interface SerializableOptions {
	parameter?: number;
}

interface SerializableProperty {
	key: string;
	parameter?: number;
}

interface SerializableMetadata {
	properties: SerializableProperty[];
}

export interface SerializedObject {
	properties: Record<string, unknown>;
}

const metadataKey = Symbol("serializable");
const metadata = new WeakMap<Constructor, SerializableMetadata>();

export function serializable(value: Function, ctx: ClassDecoratorContext): void;
export function serializable(options?: SerializableOptions): (value: undefined | ClassAccessorDecoratorTarget<any, any>, ctx: ClassFieldDecoratorContext | ClassAccessorDecoratorContext) => void;
export function serializable(...args: any[]): any {
	if (args.length === 2) {
		const [value, ctx] = args;

		if (ctx.kind === "class") {
			const properties = (ctx.metadata as any)?.[metadataKey] ?? [];
			metadata.set(value, { properties });
			return;
		}

		return;
	}

	const options: SerializableOptions = args[0] ?? {};

	if (options.parameter !== undefined && (!Number.isInteger(options.parameter) || options.parameter < 0)) {
		throw new Error("Constructor parameter index must be a non-negative integer.");
	}

	return (_value: any, ctx: ClassFieldDecoratorContext | ClassAccessorDecoratorContext) => {
		if (typeof ctx.name !== "string") {
			throw new Error("Serializable properties must have string names.");
		}

		const target = ctx.metadata as any;
		const properties: SerializableProperty[] = Object.hasOwn(target, metadataKey)
			? target[metadataKey]
			: [];

		if (properties.some(property => property.key === ctx.name)) {
			throw new Error(`Property '${ctx.name}' is already serializable.`);
		}

		if (options.parameter !== undefined && properties.some(property => property.parameter === options.parameter)) {
			throw new Error(`Constructor parameter ${options.parameter} is already mapped.`);
		}

		properties.push({
			key: ctx.name,
			...(options.parameter !== undefined && { parameter: options.parameter })
		});

		if (!Object.hasOwn(target, metadataKey)) {
			Object.defineProperty(target, metadataKey, { value: properties });
		}
	};
}

const getMetadata = (type: Constructor): SerializableMetadata => {
	const result = metadata.get(type);

	if (!result) {
		throw new Error(`Class '${type.name}' is not serializable.`);
	}

	return result;
};

export const serialize = <T extends object>(obj: T): SerializedObject => {
	const properties = getMetadata(obj.constructor as Constructor).properties;
	const result: Record<string, unknown> = {};

	for (const property of properties) {
		result[property.key] = (obj as any)[property.key];
	}

	return { properties: result };
};

export const deserialize = <T extends Constructor>(type: T, json: SerializedObject): InstanceType<T> => {
	const properties = getMetadata(type).properties;
	const args: unknown[] = [];

	for (const property of properties) {
		if (property.parameter !== undefined) {
			if (!Object.hasOwn(json.properties, property.key)) {
				throw new Error(`Missing serialized constructor property '${property.key}'.`);
			}

			args[property.parameter] = json.properties[property.key];
		}
	}

	for (let i = 0; i < args.length; i++) {
		if (!Object.hasOwn(args, i)) {
			throw new Error(`Missing mapping for constructor parameter ${i}.`);
		}
	}

	const instance = new type(...args);

	for (const property of properties) {
		if (property.parameter === undefined) {
			if (!Object.hasOwn(json.properties, property.key)) {
				throw new Error(`Missing serialized property '${property.key}'.`);
			}

			(instance as any)[property.key] = json.properties[property.key];
		}
	}

	return instance as InstanceType<T>;
};
