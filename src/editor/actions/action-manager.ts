import type { EditorAction, ActionConstructor } from "./action";
import { getActionMetadata } from "./action";
import { ActionHistory } from "./history";

type ActionFactory = (...args: any[]) => EditorAction | null;
type RegisteredAction = {
	factory: ActionFactory;
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
	private shortcuts = new Map<string, string>();
	private commands = new Map<string, () => void>();

	public constructor() {
		this.commands.set("history.undo", () => this.undo());
		this.commands.set("history.redo", () => this.redo());
		this.bindShortcut("history.undo", "Mod+Z");
		this.bindShortcut("history.redo", "Mod+Shift+Z");
	}

	public register(type: ActionConstructor, factory: ActionFactory): void {
		const metadata = getActionMetadata(type);

		if (!metadata)
			throw new Error(`Action '${type.name}' has no action metadata.`);

		if (this.actions.has(metadata.id) || this.commands.has(metadata.id))
			throw new Error(`Action '${metadata.id}' is already registered.`);

		this.actions.set(metadata.id, { factory });

		if (metadata.shortcut) {
			const shortcuts = Array.isArray(metadata.shortcut) ? metadata.shortcut : [metadata.shortcut];

			for (const shortcut of shortcuts)
				this.bindShortcut(metadata.id, shortcut);
		}
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

	public executeById(id: string, ...args: any[]): void {
		const command = this.commands.get(id);

		if (command) {
			command();
			return;
		}

		const registered = this.actions.get(id);

		if (!registered)
			throw new Error(`Action '${id}' is not registered.`);

		const action = registered.factory(...args);

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

		const id = this.shortcuts.get(getEventShortcut(event));

		if (!id)
			return;

		event.preventDefault();
		this.executeById(id);
	}

	private bindShortcut(id: string, shortcut: string): void {
		const key = normalizeShortcut(shortcut);
		const existing = this.shortcuts.get(key);

		if (existing)
			throw new Error(`Shortcut '${shortcut}' is already assigned to '${existing}'.`);

		this.shortcuts.set(key, id);
	}
}