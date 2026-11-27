export const eventEmitter = <const T extends Record<string, any>>(): IEventEmitter<NoInfer<T>> => {
	const handlers = new Map<keyof T, EventHandler<any>[]>();
	const onceHandlers = new Map<keyof T, EventHandler<any>[]>();
	const subscribers: Subscriber<T>[] = [];

	const subscribeHandler = (target: Map<keyof T, EventHandler<any>[]>, event: keyof T, handler: EventHandler<any>) => {
		if (!target.has(event))
			target.set(event, []);
		target.get(event)!.push(handler);

		return () => {
			const h = target.get(event);
			if (h) {
				const index = h.indexOf(handler);
				if (index > -1)
					h.splice(index, 1);
			};
		}
	};

	const emitter: IEventEmitter<NoInfer<T>> = {
		emit: (event, data) => {
			const h = [
				...(handlers.get(event) || []),
				...(onceHandlers.get(event) || [])
			];
			onceHandlers.set(event, []);
			h.forEach(h => h(data));
		},
		on: (event, handler) => subscribeHandler(handlers, event, handler),
		once: (event, handler) => subscribeHandler(onceHandlers, event, handler),
		subscribe: (subscriber: Subscriber<T>): Unsubscriber => {
			subscribers.push(subscriber);
			return () => {
				const index = subscribers.indexOf(subscriber);
				if (index > -1)
					subscribers.splice(index, 1);
			};
		},
		dispose: () => {
			handlers.clear();
			onceHandlers.clear();
			const throwError = () => { new Error(`Event emitter is disposed!`); }
			Object.assign(emitter, {
				emit: throwError,
				on: throwError,
				once: throwError,
				subscribe: throwError,
				dispose: () => { },
			});
		},
	};

	return emitter;
};

export type IEventEmitter<T extends Record<string, any>> = {
	readonly emit: <K extends keyof T>(event: K, data: T[K]) => void;
	readonly on: <K extends keyof T>(event: K, handler: EventHandler<T[K]>) => Unsubscriber;
	readonly once: <K extends keyof T>(event: K, handler: EventHandler<T[K]>) => Unsubscriber;
	readonly subscribe: (subscriber: Subscriber<T>) => Unsubscriber;
	readonly dispose: () => void;
};

export type Unsubscriber = () => void;
export type Subscriber<T extends Record<string, any>> = <K extends keyof T>(event: K, data: T[K]) => any;
export type EventHandler<T> = (event: Readonly<T>) => any;

export class EventEmitter<const T extends Record<string, any>> implements Omit<IEventEmitter<T>, "emit"> {
	private readonly handlers = new Map<keyof T, EventHandler<any>[]>();
	private readonly onceHandlers = new Map<keyof T, EventHandler<any>[]>();
	private readonly subscribers: Subscriber<T>[] = [];
	
	private _emitCount = 0;

	protected get emitCount() { return this._emitCount; }

	private readonly subscribeHandler = (target: Map<keyof T, EventHandler<any>[]>, event: keyof T, handler: EventHandler<any>) => {
		if (!target.has(event))
			target.set(event, []);
		target.get(event)!.push(handler);

		return () => {
			const h = target.get(event);
			if (h) {
				const index = h.indexOf(handler);
				if (index > -1)
					h.splice(index, 1);
			};
		}
	};

	private readonly getHandlers = <K extends keyof T>(event: K): EventHandler<T[K]>[] => {
		const handlers = [
			...(this.handlers.get(event) || []),
			...(this.onceHandlers.get(event) || []),
			...this.subscribers.map(s => (data: T[K]) => s(event, data)) as EventHandler<T[K]>[]
		];
		this.onceHandlers.set(event, []);
		return handlers;
	}

	protected readonly emit = <K extends keyof T>(event: K, data: T[K]): void => {
		this._emitCount += 1;
		this.getHandlers(event).forEach(h => h(data));
	}

	public readonly on = <K extends keyof T>(event: K, handler: EventHandler<T[K]>): Unsubscriber => this.subscribeHandler(this.handlers, event, handler);
	public readonly once = <K extends keyof T>(event: K, handler: EventHandler<T[K]>): Unsubscriber => this.subscribeHandler(this.onceHandlers, event, handler);

	public readonly subscribe = (subscriber: Subscriber<T>): Unsubscriber => {
		this.subscribers.push(subscriber);
		return () => {
			const index = this.subscribers.indexOf(subscriber);
			if (index > -1)
				this.subscribers.splice(index, 1);
		};
	}

	public dispose() {
		this.handlers.clear();
		this.onceHandlers.clear();

		const throwError = () => { new Error(`Event emitter is disposed!`); }

		Object.assign(this, {
			subscribers: [],
			emit: throwError,
			on: throwError,
			once: throwError,
			subscribe: throwError,
			dispose: () => { },
		});
	}
}