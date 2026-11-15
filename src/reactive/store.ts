import { useObservable } from "./hook";

const stores = new Map<Ctor, any>();

type Ctor = new () => any;

export const registerStore = <T extends Ctor>(type: T, _: ClassDecoratorContext) => {
	stores.set(type, new type());
};

export const getStore = <T extends Ctor>(type: T): InstanceType<T> => {
	const store = stores.get(type);
	if(!store)
		throw new Error(`Store ${type.name} is not registered!`);
	return store;
};

export const useStore = <T extends Ctor>(type: T) => useObservable(getStore(type));

let isInitialized = false;

export const initStores = async () => {
	if (isInitialized)
		return;

	isInitialized = true;

	const promises = Array.from(stores.values().map(store => "init" in store && store.init()));
	await Promise.all(promises);
};

export interface Store {
	init?(): void | Promise<void>;
}