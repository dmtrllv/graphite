import { type MenuItemChild, MenuItem } from "@editor/menubar";

export const getFirstItem = (children: MenuItemChild[]): number => children.findIndex(child => child instanceof MenuItem);

export const getLastItem = (children: MenuItemChild[]): number => children.findLastIndex(child => child instanceof MenuItem);

export const getChildrenAtPath = (menu: MenuItem, path: number[]): MenuItemChild[] => {
	let children = menu._children;

	for (const index of path) {
		const child = children[index];
		if (!(child instanceof MenuItem))
			return [];

		children = child._children;
	}

	return children;
};