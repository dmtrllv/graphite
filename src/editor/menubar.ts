import { observable } from "../reactive";

@observable
export class Menubar {
	@observable
	public accessor items: MenuItem[];

	public constructor(items: MenuItem[]) {
		this.items = items;
	}
}

@observable
export class MenuItem {
	public readonly id: string;

	@observable
	public accessor text: string;

	public accessor action: MenuAction | undefined;

	@observable
	public accessor children: MenuItemChild[];

	public constructor(id: string, text: string, action?: MenuAction, children: MenuItemChild[] = []) {
		this.id = id;
		this.text = text;
		this.action = action;
		this.children = children.map(c => c instanceof MenuItem ? Object.assign(c, { id: `${id}.${c.id}` }) : c);
	}
}

export const MenuSeparator = Symbol();

export type MenuSeparator = typeof MenuSeparator;

export type MenuItemChild = MenuItem | MenuSeparator;

export type MenuAction = (item: MenuItem, menubar: Menubar) => void;