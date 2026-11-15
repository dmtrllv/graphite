const makeImmutable = <T extends {}>(obj: T): Immutable<T> => Object.freeze(obj) as Immutable<T>;

const deepImmutable = <T extends {}>(obj: T): DeepImmutable<T> => {
	for(const k in obj) {
		const val = obj[k];
		if(typeof val === "object" && val !== null)
			deepImmutable(val);
	}
	return makeImmutable(obj) as DeepImmutable<T>;
};

export const immutable = Object.assign(makeImmutable, {
	deep: deepImmutable
});

export type Immutable<T> =
	T extends Map<infer K, infer V> ? ReadonlyMap<K, V> :
	T extends Set<infer V> ? ReadonlySet<V> :
	T extends Array<infer V> ? ReadonlyArray<V> :
	Readonly<T>;

export type DeepImmutable<T> =
	T extends Map<infer K, infer V> ? ReadonlyMap<K, DeepImmutable<V>> :
	T extends Set<infer V> ? ReadonlySet<DeepImmutable<V>> :
	T extends Array<infer V> ? ReadonlyArray<DeepImmutable<V>> :
	T extends {} ? { readonly [K in keyof T]: DeepImmutable<T[K]> } :
	Readonly<T>;