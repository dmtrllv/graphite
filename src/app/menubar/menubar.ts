import { computed, observable } from "@reactive";

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
	@observable
	public accessor text: string;

	public accessor action: MenuAction | undefined;

	@observable
	private accessor _children: MenuChildren;

	public set children(children: MenuItemChild[]) {
		this._children = children;
	}

	@computed
	public get children(): MenuItemChild[] {
		return this._children;
	}

	public constructor(text: string, children: MenuChildren);
	public constructor(text: string, action: MenuAction, children?: MenuChildren);
	public constructor(text: string, actionOrChildren: MenuAction | MenuChildren, children: MenuChildren = []) {
		this.text = text;
		if(typeof actionOrChildren === "function") {
			this.action = actionOrChildren;
			this._children = children;
		} else {
			this.action = () => {};
			this._children = actionOrChildren;
		}
	}
}

export type MenuChildren = MenuItemChild[];

export const MenuSeparator = Symbol();

export type MenuSeparator = typeof MenuSeparator;

export type MenuItemChild = MenuItem | MenuSeparator;

export type MenuAction = (item: MenuItem, menubar: Menubar) => void;