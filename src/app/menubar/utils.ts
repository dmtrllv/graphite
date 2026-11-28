import { type MenuItemChild, MenuItem } from "./menubar";

export const getFirstItem = (children: MenuItemChild[]): number => children.findIndex(child => child instanceof MenuItem);

export const getLastItem = (children: MenuItemChild[]): number => children.findLastIndex(child => child instanceof MenuItem);

export const getChildrenAtPath = (menu: MenuItem, path: number[]): MenuItemChild[] => {
	let children = menu.children;

	for (const index of path) {
		const child = children[index];
		if (!(child instanceof MenuItem))
			return [];

		children = child.children;
	}

	return children;
};