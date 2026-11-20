export type SerializableData = Record<string, unknown>;

export type SerializationContext = Record<string, any>;

type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor;

type SerializableConstructor<T extends Serializable = Serializable> = abstract new (...args: any[]) => T;

type SerializableFactory<T extends Serializable = Serializable> = (data: any, context: SerializationContext) => T;

type ArrayType = {
	readonly kind: "array";
	readonly type: SerializableType;
};

type MapType = {
	readonly kind: "map";
	readonly key: PrimitiveConstructor;
	readonly value: SerializableType;
	readonly context?: ((parent: any) => SerializationContext) | undefined;
};

type ReferenceType = {
	readonly kind: "reference";
	readonly type: SerializableConstructor;
};

type RecordType = {
	readonly kind: "record";
	readonly value: PrimitiveConstructor;
};

type SerializableType = PrimitiveConstructor | SerializableConstructor | ArrayType | MapType | ReferenceType | RecordType;

type SerializableDescriptor = {
	type: string;
	create: SerializableFactory;
};

type SerializableMetadata = Map<string | symbol, SerializableType>;
type SerializablePropertyDecorator<Value> = <This>(value: undefined | ClassAccessorDecoratorTarget<This, Value>, context: ClassFieldDecoratorContext<This, Value> | ClassAccessorDecoratorContext<This, Value>) => void;

type PendingReference = { readonly pending: true; };
const PENDING: PendingReference = { pending: true };

const metadataKey = Symbol("serializable");
const metadataRegistry = new WeakMap<Function, SerializableMetadata>();
const typeRegistry = new Map<string, SerializableDescriptor>();
const constructorRegistry = new WeakMap<Function, string>();

export const arrayOf = (type: SerializableType): ArrayType => ({ kind: "array", type });
export const mapOf = (key: PrimitiveConstructor, value: SerializableType, context?: (parent: any) => SerializationContext): MapType => ({ kind: "map", key, value, context });
export const reference = (type: SerializableConstructor): ReferenceType => ({ kind: "reference", type });
export const recordOf = (value: PrimitiveConstructor): RecordType => ({ kind: "record", value });

export const registerSerializableType = <T extends Serializable>(target: Function, type: string, create: SerializableFactory<T>): void => {
	if (typeof target !== "function")
		throw new TypeError(`Invalid serializable constructor for '${type}': ${String(target)}`);

	if (typeRegistry.has(type))
		throw new Error(`Serializable type '${type}' is already registered.`);

	if (constructorRegistry.has(target))
		throw new Error(`Class '${target.name}' is already registered as serializable.`);

	typeRegistry.set(type, { type, create });
	constructorRegistry.set(target, type);
};

const getProperties = (metadata: object): SerializableMetadata => {
	if (Object.prototype.hasOwnProperty.call(metadata, metadataKey))
		return (metadata as any)[metadataKey];

	const properties = new Map<string | symbol, SerializableType>();
	let current = Object.getPrototypeOf(metadata);

	while (current) {
		const inherited = Object.prototype.hasOwnProperty.call(current, metadataKey) ? current[metadataKey] as SerializableMetadata : undefined;

		if (inherited)
			for (const [key, value] of inherited)
				if (!properties.has(key))
					properties.set(key, value);

		current = Object.getPrototypeOf(current);
	}

	Object.defineProperty(metadata, metadataKey, { value: properties });
	return properties;
};

const getMetadata = (constructor: Function): SerializableMetadata => {
	const metadata = (constructor as any)[Symbol.metadata];

	if (!metadata)
		throw new Error(`Class '${constructor.name}' has no decorator metadata.`);

	if (metadataRegistry.has(constructor))
		return metadataRegistry.get(constructor)!;

	const properties = new Map<string | symbol, SerializableType>();
	let current = metadata;

	while (current) {
		const own = Object.prototype.hasOwnProperty.call(current, metadataKey) ? current[metadataKey] as SerializableMetadata : undefined;

		if (own) {
			for (const [key, value] of own)
				if (!properties.has(key))
					properties.set(key, value);
		}

		current = Object.getPrototypeOf(current);
	}

	metadataRegistry.set(constructor, properties);
	return properties;
};

export abstract class Serializable {
	public constructor(_data: SerializableData = {}) { }

	public static deserialize<T extends Serializable>(this: new (...args: any[]) => T, data: any, context: SerializationContext = {}): T {
		return deserializeDocument(this, data, context);
	}

	public serialize(): SerializableData {
		return serializeDocument(this);
	}

	protected afterDeserialize(): void { }

	public clone(): this {
		return (this.constructor as any).deserialize(this.serialize()) as this;
	}
}

export function serializable<T extends Serializable>(options: { type: string; create: SerializableFactory<T> }): (value: Function, context: ClassDecoratorContext) => void;
export function serializable(type: StringConstructor): SerializablePropertyDecorator<string | null>;
export function serializable(type: NumberConstructor): SerializablePropertyDecorator<number | null>;
export function serializable(type: BooleanConstructor): SerializablePropertyDecorator<boolean | null>;
export function serializable<T extends Serializable>(type: SerializableConstructor<T>): SerializablePropertyDecorator<T>;
export function serializable(type: ArrayType): SerializablePropertyDecorator<readonly any[]>;
export function serializable(type: MapType): SerializablePropertyDecorator<Map<any, any>>;
export function serializable(type: ReferenceType): SerializablePropertyDecorator<any>;
export function serializable(type: RecordType): SerializablePropertyDecorator<Record<string, any>>;
export function serializable(type: SerializableType): (value: undefined, context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext) => void;
export function serializable(...args: any[]): any {
	if (args.length === 1 && typeof args[0] === "object" && args[0] !== null && "type" in args[0] && "create" in args[0]) {
		const options = args[0] as { type: string; create: SerializableFactory };
		return (target: Function, context: ClassDecoratorContext) => {
			if (!context.metadata)
				throw new Error("Decorator metadata is unavailable. Make sure Symbol.metadata is supported.");
			registerSerializableType(target, options.type, options.create);
			getProperties(context.metadata);
			return target;
		};
	}

	const type = args[0] as SerializableType;
	return (_value: undefined, context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext) => {
		if (!context.metadata)
			throw new Error("Decorator metadata is unavailable. Make sure Symbol.metadata is supported.");
		getProperties(context.metadata).set(context.name, type);
	};
}

const serializeDocument = (root: Serializable): SerializableData => {
	const identities = new WeakMap<object, string>();
	let nextId = 1;

	const visit = (value: any, type: SerializableType): void => {
		if (value == null || isPrimitiveType(type) || isReferenceType(type) || isRecordType(type))
			return;

		if (isArrayType(type)) {
			for (const item of value)
				visit(item, type.type);
			return;
		}

		if (isMapType(type)) {
			for (const item of value.values())
				visit(item, type.value);
			return;
		}

		if (identities.has(value))
			return;

		identities.set(value, String(nextId++));

		for (const [name, propertyType] of getMetadata(value.constructor))
			visit(Reflect.get(value, name), propertyType);
	};

	const encode = (value: any, type: SerializableType): any => {
		if (value == null || isPrimitiveType(type))
			return value;

		if (isArrayType(type))
			return value.map((item: any) => encode(item, type.type));

		if (isMapType(type))
			return { $map: [...value.entries()].map(([key, item]) => [key, encode(item, type.value)]) };

		if (isRecordType(type))
			return { ...value };

		if (isReferenceType(type))
			return { $ref: identities.get(value)! };

		const result: Record<string, unknown> = {
			$type: constructorRegistry.get(value.constructor),
			$id: identities.get(value)!
		};

		for (const [name, propertyType] of getMetadata(value.constructor))
			result[String(name)] = encode(Reflect.get(value, name), propertyType);

		return result;
	};

	const type = root.constructor as SerializableConstructor;
	visit(root, type);
	return encode(root, type);
};

const deserializeDocument = <T extends Serializable>(rootType: new (...args: any[]) => T, data: any, context: SerializationContext): T => {
	const identities = new Map<string, Serializable>();
	const pending: (() => boolean)[] = [];
	const hooks: Serializable[] = [];

	const decode = (value: any, type: SerializableType, parent: any, path: string, assign: (value: any) => void, inheritedContext: SerializationContext): any => {
		if (value === null || value === undefined) {
			assign(value);
			return value;
		}

		if (isArrayType(type)) {
			if (!Array.isArray(value))
				throw new TypeError(`Expected an array at '${path}'.`);

			const result: any[] = new Array(value.length);

			value.forEach((item, index) => decode(item, type.type, parent, `${path}[${index}]`, resolved => result[index] = resolved, inheritedContext));
			assign(result);
			return result;
		}

		if (isMapType(type)) {
			if (!value || !Array.isArray(value.$map))
				throw new TypeError(`Expected a serialized Map at '${path}'.`);

			const result = new Map();

			for (const [key, item] of value.$map) {
				validatePrimitive(key, type.key, `${path}.key`);
				const context = type.context ? type.context(parent) : inheritedContext;
				decode(item, type.value, parent, `${path}[${String(key)}]`, resolved => result.set(key, resolved), context);
			}

			assign(result);
			return result;
		}

		if (isRecordType(type)) {
			if (!value || typeof value !== "object" || Array.isArray(value))
				throw new TypeError(`Expected an object at '${path}'.`);

			const result: Record<string, unknown> = {};

			for (const [key, item] of Object.entries(value)) {
				validatePrimitive(item, type.value, `${path}.${key}`);
				result[key] = item;
			}

			assign(result);
			return result;
		}

		if (isReferenceType(type)) {
			if (!value || typeof value.$ref !== "string")
				throw new TypeError(`Expected an object reference at '${path}'.`);

			const existing = identities.get(value.$ref);

			if (existing) {
				if (!(existing instanceof type.type))
					throw new TypeError(`Invalid reference type at '${path}'.`);

				assign(existing);
				return existing;
			}

			pending.push(() => {
				const resolved = identities.get(value.$ref);

				if (!resolved)
					return false;

				if (!(resolved instanceof type.type))
					throw new TypeError(`Invalid reference type at '${path}'.`);

				assign(resolved);
				return true;
			});

			return PENDING;
		}

		if (isPrimitiveType(type)) {
			validatePrimitive(value, type, path);
			assign(value);
			return value;
		}

		if (!value || typeof value !== "object" || typeof value.$type !== "string" || typeof value.$id !== "string")
			throw new TypeError(`Invalid serialized object at '${path}'.`);

		const descriptor = typeRegistry.get(value.$type);

		if (!descriptor)
			throw new Error(`Unknown serializable type '${value.$type}' at '${path}'.`);

		const instance = descriptor.create(value, inheritedContext);

		if (!(instance instanceof type) && type !== Serializable)
			throw new TypeError(`Unexpected serialized type '${value.$type}' at '${path}'.`);

		if (identities.has(value.$id))
			throw new Error(`Duplicate serialized object ID '${value.$id}'.`);

		identities.set(value.$id, instance);
		assign(instance);

		const metadata = getMetadata(instance.constructor);

		for (const [name, propertyType] of metadata) {
			if (!Object.prototype.hasOwnProperty.call(value, name))
				continue;

			decode(value[name], propertyType, instance, `${path}.${String(name)}`, resolved => {
				if (!Reflect.set(instance, name, resolved))
					throw new Error(`Could not assign '${path}.${String(name)}'.`);
			}, inheritedContext);
		}

		hooks.push(instance);
		return instance;
	};

	let result!: T;
	decode(data, rootType as unknown as SerializableConstructor, null, "$root", value => result = value, context);

	while (pending.length) {
		const current = pending.splice(0);
		let resolvedAny = false;

		for (const resolve of current) {
			if (resolve())
				resolvedAny = true;
			else
				pending.push(resolve);
		}

		if (!resolvedAny)
			throw new Error("Serialized document contains unresolved object references.");
	}

	for (const instance of hooks)
		instance["afterDeserialize"]();

	return result;
};

const validatePrimitive = (value: any, type: PrimitiveConstructor, path: string): void => {
	if (typeof value !== primitiveTypeOf(type))
		throw new TypeError(`Invalid value at '${path}'. Expected ${type.name}.`);
};

const isArrayType = (type: SerializableType): type is ArrayType => typeof type === "object" && type.kind === "array";
const isMapType = (type: SerializableType): type is MapType => typeof type === "object" && type.kind === "map";
const isReferenceType = (type: SerializableType): type is ReferenceType => typeof type === "object" && type.kind === "reference";
const isRecordType = (type: SerializableType): type is RecordType => typeof type === "object" && type.kind === "record";
const isPrimitiveType = (type: SerializableType): type is PrimitiveConstructor => type === String || type === Number || type === Boolean;
const primitiveTypeOf = (type: PrimitiveConstructor): string => type === String ? "string" : type === Number ? "number" : "boolean";