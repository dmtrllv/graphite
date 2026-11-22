export interface EditorAction {
	execute(): void;
	undo(): void;
}

export type ActivationReference<T extends object = object> = () => ActivationConstructor<T>;

export type ActivationConstructor<TContext extends object = object> = abstract new (...args: any[]) => TContext;

export type ActionMetadata = {
	id: string;
	shortcut?: string | string[];
	activation?: ActivationReference;
	history?: boolean;
};

export type ActionConstructor = abstract new (...args: any[]) => EditorAction;

const actionMetadata = new WeakMap<Function, ActionMetadata>();

export const action = (metadata: ActionMetadata) => <T extends ActionConstructor>(value: T, _context: ClassDecoratorContext<T>): void => {
	if (!metadata.id.trim())
		throw new Error("An action must have a non-empty id.");

	if (actionMetadata.has(value))
		throw new Error(`Action '${metadata.id}' is already decorated.`);

	actionMetadata.set(value, metadata);
};

export const getActionMetadata = (type: Function): ActionMetadata | undefined => actionMetadata.get(type);
