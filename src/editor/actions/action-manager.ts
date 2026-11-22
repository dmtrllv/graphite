import type { EditorAction, ActionConstructor, ActivationConstructor } from "./action";
import { getActionMetadata } from "./action";
import { ActionHistory } from "./history";

type RegisteredAction = {
	factory: (context: object | null) => EditorAction | null;
	activation: ActivationConstructor | null;
};

const normalizeShortcut = (shortcut: string): string => {
	const parts = shortcut.split("+").map(part => part.trim());
	const key = parts.pop()!;
	const modifiers = new Set(parts.map(part => {
		switch (part.toLowerCase()) {
			case "control": return "Ctrl";
			case "command":
			case "cmd":
			case "meta": return "Mod";
			default: return part;
		}
	}));
	const order = ["Mod", "Ctrl", "Alt", "Shift"];
	return [...order.filter(modifier => modifiers.has(modifier)), key.length === 1 ? key.toUpperCase() : key].join("+");
};

const getEventShortcut = (event: KeyboardEvent): string => {
	const modifiers = [];
	if (event.ctrlKey || event.metaKey) modifiers.push("Mod");
	if (event.altKey) modifiers.push("Alt");
	if (event.shiftKey) modifiers.push("Shift");
	return [...modifiers, event.key.length === 1 ? event.key.toUpperCase() : event.key].join("+");
};

const isEditableTarget = (target: EventTarget | null): boolean => {
	if (!(target instanceof HTMLElement))
		return false;

	return target.isContentEditable || !!target.closest("input, textarea, select, [contenteditable='true']");
};

export class ActionManager {
	public readonly history = new ActionHistory();

	private actions = new Map<string, RegisteredAction>();
	private shortcuts = new Map<string, string[]>();
	private commands = new Map<string, () => void>();
	private activationStack: object[] = [];

	public constructor() {
		this.commands.set("history.undo", () => this.undo());
		this.commands.set("history.redo", () => this.redo());
		this.bindShortcut("history.undo", "Mod+Z");
		this.bindShortcut("history.redo", "Mod+Shift+Z");
	}

	public get activeContext(): object | null {
		return this.activationStack.at(-1) ?? null;
	}

	public register(type: ActionConstructor, factory: () => EditorAction | null): void;
	public register<TActivation extends ActivationConstructor>(type: ActionConstructor, activation: TActivation, factory: (context: InstanceType<TActivation>) => EditorAction | null): void;
	public register(type: ActionConstructor, activationOrFactory: ActivationConstructor | (() => EditorAction | null), contextualFactory?: (...args: never[]) => EditorAction | null): void {
		const metadata = getActionMetadata(type);

		if (!metadata)
			throw new Error(`Action '${type.name}' has no action metadata.`);

		if (this.actions.has(metadata.id) || this.commands.has(metadata.id))
			throw new Error(`Action '${metadata.id}' is already registered.`);

		if (contextualFactory) {
			if (!metadata.activation || activationOrFactory !== metadata.activation())
				throw new Error(`Action '${metadata.id}' must be registered with its declared activation type.`);

			const activation = metadata.activation();
			this.actions.set(metadata.id, {
				activation,
				factory: context => context instanceof activation
					? Reflect.apply(contextualFactory, undefined, [context]) as EditorAction | null
					: null
			});
		} else {
			if (metadata.activation)
				throw new Error(`Action '${metadata.id}' requires an activation context.`);

			const factory = activationOrFactory as () => EditorAction | null;
			this.actions.set(metadata.id, {
				activation: null,
				factory: () => factory()
			});
		}

		if (metadata.shortcut) {
			const shortcuts = Array.isArray(metadata.shortcut) ? metadata.shortcut : [metadata.shortcut];

			for (const shortcut of shortcuts)
				this.bindShortcut(metadata.id, shortcut);
		}
	}

	public activate(context: object): void {
		this.deactivate(context);
		this.activationStack.push(context);
	}

	public deactivate(context: object): void {
		this.activationStack = this.activationStack.filter(item => item !== context);
	}

	public execute(action: EditorAction): void {
		const metadata = getActionMetadata(action.constructor);

		if (!metadata)
			throw new Error(`Action '${action.constructor.name}' has no action metadata.`);

		if (metadata.history)
			this.history.execute(action);
		else
			action.execute();
	}

	public executeById(id: string): void {
		const command = this.commands.get(id);

		if (command) {
			command();
			return;
		}

		const registered = this.actions.get(id);

		if (!registered)
			throw new Error(`Action '${id}' is not registered.`);

		const action = registered.factory(this.activeContext);

		if (action)
			this.execute(action);
	}

	public recordApplied(action: EditorAction): void {
		const metadata = getActionMetadata(action.constructor);

		if (!metadata)
			throw new Error(`Action '${action.constructor.name}' has no action metadata.`);

		if (metadata.history)
			this.history.recordApplied(action);
	}

	public undo(): void {
		this.history.undo();
	}

	public redo(): void {
		this.history.redo();
	}

	public handleKeyDown(event: KeyboardEvent): void {
		if (event.defaultPrevented || event.isComposing || isEditableTarget(event.target))
			return;

		const ids = this.shortcuts.get(getEventShortcut(event));

		if (!ids)
			return;

		const activeContext = this.activeContext;
		let id: string | undefined;

		if (activeContext) {
			const contextual = ids.filter(id => this.actions.get(id)?.activation && activeContext instanceof this.actions.get(id)!.activation!);

			if (contextual.length > 1)
				throw new Error(`Shortcut '${getEventShortcut(event)}' is ambiguous for the active context.`);

			id = contextual[0];
		}

		id ??= ids.find(id => this.actions.get(id)?.activation === null || this.commands.has(id));

		if (!id)
			return;

		event.preventDefault();
		this.executeById(id);
	}

	private bindShortcut(id: string, shortcut: string): void {
		const key = normalizeShortcut(shortcut);
		const ids = this.shortcuts.get(key) ?? [];

		if (ids.includes(id))
			return;

		const metadata = this.actions.get(id);
		const activation = metadata?.activation ?? null;

		for (const existingId of ids) {
			const existing = this.actions.get(existingId);
			const existingActivation = existing?.activation ?? null;

			if (activation === existingActivation)
				throw new Error(`Shortcut '${shortcut}' is already assigned to '${existingId}'.`);
		}

		this.shortcuts.set(key, [...ids, id]);
	}
}
