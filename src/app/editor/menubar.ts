import { observable } from "@reactive";

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
	private accessor _children: MenuChildren;

	public set children(children: MenuItemChild[]) {
		this._children = children;
	}

	public get children(): MenuItemChild[] {
		if(typeof this._children === "function")
			this._children = this._children().map(c => c instanceof MenuItem ? Object.assign(c, { id: `${this.id}.${c.id}` }) : c);
		return this._children;
	}

	public constructor(id: string, text: string, action?: MenuAction, children: MenuChildren = []) {
		this.id = id;
		this.text = text;
		this.action = action;
		if (typeof children === "function")
			this._children = children;
		else
			this._children = children.map(c => c instanceof MenuItem ? Object.assign(c, { id: `${id}.${c.id}` }) : c);
	}
}

export type MenuChildren = MenuItemChild[] | (() => MenuItemChild[]);

export const MenuSeparator = Symbol();

export type MenuSeparator = typeof MenuSeparator;

export type MenuItemChild = MenuItem | MenuSeparator;

export type MenuAction = (item: MenuItem, menubar: Menubar) => void;