const metadataKey = Symbol("serializable");

type PrimitiveConstructor = StringConstructor | NumberConstructor | BooleanConstructor;

type SerializableConstructor<T extends Serializable> = new (data: any, ...args: any[]) => T;

type ConstructorArgs<T> = T extends new (data: any, ...args: infer A) => any ? A : never;

type ArrayType = {
	readonly kind: "array";
	readonly type: SerializableType;
};

type SerializableType = PrimitiveConstructor | SerializableConstructor<any> | ArrayType;

type SerializableMetadata = Map<string | symbol, SerializableType>;

const metadataRegistry = new WeakMap<Function, SerializableMetadata>();

export const arrayOf = (type: SerializableType): ArrayType => ({ kind: "array", type });

export type SerializableData = Record<string, unknown>;

export abstract class Serializable<TData extends object = SerializableData> {
	public constructor(_data: TData) { }

	public static deserialize<C extends SerializableConstructor<any>>(this: C, data: unknown, ...args: ConstructorArgs<C>): InstanceType<C> {
		if (!data || typeof data !== "object" || Array.isArray(data))
			throw new TypeError(`Invalid serialized data for '${this.name}'.`);

		const metadata = metadataRegistry.get(this);

		if (!metadata)
			throw new Error(`Class '${this.name}' is not serializable.`);

		const instance = new this(data, ...args) as InstanceType<C>;

		for (const [name, type] of metadata) {
			if (!Object.prototype.hasOwnProperty.call(data, name))
				continue;

			const value = deserializeValue((data as Record<PropertyKey, unknown>)[name], type, `${this.name}.${String(name)}`);

			if (!Reflect.set(instance, name, value))
				throw new Error(`Could not assign serialized property '${this.name}.${String(name)}'.`);
		}

		instance.afterDeserialize();
		return instance;
	}

	public serialize(): TData {
		const metadata = metadataRegistry.get(this.constructor);

		if (!metadata)
			throw new Error(`Class '${this.constructor.name}' is not serializable.`);

		const data: Record<PropertyKey, unknown> = {};

		for (const [name, type] of metadata)
			data[name] = serializeValue(Reflect.get(this, name), type, `${this.constructor.name}.${String(name)}`);

		return data as TData;
	}

	public clone(...args: unknown[]): this {
		const constructor = this.constructor as any;
		return constructor.deserialize(this.serialize(), ...args) as this;
	}

	protected afterDeserialize(): void { }
}

export function serializable<T extends SerializableConstructor<any>>(value: T, context: ClassDecoratorContext): T;
export function serializable<This, Value>(type: SerializableType): (value: undefined | ClassAccessorDecoratorTarget<This, Value>, context: ClassFieldDecoratorContext<This, Value> | ClassAccessorDecoratorContext<This, Value>) => void;
export function serializable(...args: any[]): any {
	if (args.length === 2 && typeof args[0] === "function") {
		const target = args[0] as SerializableConstructor<any>;
		const context = args[1] as ClassDecoratorContext;

		if (!(target.prototype instanceof Serializable))
			throw new TypeError(`Class '${target.name}' must extend Serializable.`);

		const properties = (context.metadata as any)?.[metadataKey] as SerializableMetadata | undefined;

		if (!properties)
			throw new Error(`No serializable properties registered for '${target.name}'.`);

		metadataRegistry.set(target, new Map(properties));
		return target;
	}

	const type = args[0] as SerializableType;

	return (_value: undefined | ClassAccessorDecoratorTarget<any, any>, context: ClassFieldDecoratorContext | ClassAccessorDecoratorContext) => {
		if (!context.metadata)
			throw new Error("Decorator metadata is unavailable. Make sure Symbol.metadata is supported.");

		let properties = (context.metadata as any)[metadataKey] as SerializableMetadata | undefined;

		if (!properties) {
			properties = new Map();
			Object.defineProperty(context.metadata, metadataKey, { value: properties });
		}

		if (properties.has(context.name))
			throw new Error(`Property '${String(context.name)}' is already registered for serialization.`);

		properties.set(context.name, type);
	};
}

const serializeValue = (value: unknown, type: SerializableType, path: string): unknown => {
	if (value === undefined || value === null)
		return value;

	if (isArrayType(type)) {
		if (!Array.isArray(value))
			throw new TypeError(`Expected an array at '${path}'.`);

		return value.map((item, index) => serializeValue(item, type.type, `${path}[${index}]`));
	}

	if (isPrimitiveType(type)) {
		if (typeof value !== primitiveTypeOf(type))
			throw new TypeError(`Invalid value at '${path}'. Expected ${type.name}.`);

		return value;
	}

	if (!(value instanceof type))
		throw new TypeError(`Invalid value at '${path}'. Expected an instance of '${type.name}'.`);

	return (value as any).serialize();
};

const deserializeValue = (value: unknown, type: SerializableType, path: string): unknown => {
	if (value === undefined || value === null)
		return value;

	if (isArrayType(type)) {
		if (!Array.isArray(value))
			throw new TypeError(`Expected an array at '${path}'.`);

		return value.map((item, index) => deserializeValue(item, type.type, `${path}[${index}]`));
	}

	if (isPrimitiveType(type)) {
		if (typeof value !== primitiveTypeOf(type))
			throw new TypeError(`Invalid value at '${path}'. Expected ${type.name}.`);

		return value;
	}

	return (type as any).deserialize(value);
};

const isArrayType = (type: SerializableType): type is ArrayType => typeof type === "object";

const isPrimitiveType = (type: SerializableType): type is PrimitiveConstructor => type === String || type === Number || type === Boolean;

const primitiveTypeOf = (type: PrimitiveConstructor): string => type === String ? "string" : type === Number ? "number" : "boolean";
