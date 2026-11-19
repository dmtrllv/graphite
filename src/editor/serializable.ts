export abstract class Serializable {
	public static deserialize<T extends typeof Serializable>(this: T, data: object, ...args: SerializableArgs<T>): InstanceType<T> {

		throw new Error("")
	}

	public serialize(): object {
		throw new Error("")
	}
	
	public constructor(props: object) {
		
	}
	
	public clone(): this {
		throw new Error("")
	}
}

type SerializableArgs<T> = T extends new (deserializedData: object, ...args: infer Args) => Serializable ? Args : any[];

export function serializable<This = unknown, Value = unknown>(type: SerializableConstructor<Value>): (target: any, ctx: ClassFieldDecoratorContext<This, Value> | ClassAccessorDecoratorContext<This, Value>) => any;
export function serializable<T>(target: T, ctx: ClassDecoratorContext): any;
export function serializable(...args: any[]): any {
	if (typeof args[0] === "function") {
		console.log(args[1].metadata);

	} else {
		if (!args[1].metadata.keys)
			args[1].metadata.keys = [];
		args[1].metadata.keys.push(args[1].name);
	}
	//const serializer = new type();
	//Object.assign(Class, {
	//	deserializer: serializer.deserialize,
	//	serializer: serializer.serialize,
	//});
};

type SerializableConstructor<T> = new (...args: any[]) => T;