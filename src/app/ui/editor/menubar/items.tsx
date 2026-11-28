import { type MenuItemChild, MenuItem, MenuSeparator } from "@editor/menubar";

type MenuItemsProps = { 
	children: MenuItemChild[];
	parentPath: number[];
	activePath: number[];
	setActivePath: (path: number[]) => void;
	execute: (item: MenuItem) => void;
}

export const MenuItems = ({ children, parentPath, activePath, execute, setActivePath }: MenuItemsProps) => (
	<div className={parentPath.length === 0 ? "menu-dropdown" : "menu-submenu"} role="menu">
		{children.map((child, index) => {
			const path = [...parentPath, index];

			if (child === MenuSeparator)
				return <div key={`separator-${index}`} className="menu-separator" role="separator" />;

			if (!(child instanceof MenuItem))
				return null;

			const selected = activePath.length >= path.length && path.every((value, i) => activePath[i] === value);
			const hasChildren = child._children.some(item => item instanceof MenuItem);

			const onPointerEnter = (e: React.PointerEvent) => {
				e.stopPropagation();
				setActivePath(path);
			};

			const onClick = () => {
				if (hasChildren)
					setActivePath(path);
				else
					execute(child);
			};

			return (
				<div key={child.id} className={`menu-item${selected ? " selected" : ""}`}>
					<button className="menu-item-button" onPointerEnter={onPointerEnter} onClick={onClick}>
						<span>{child.text}</span>
						{hasChildren && <span className="menu-submenu-indicator">&rsaquo;</span>}
					</button>
					{selected && hasChildren && (
						<MenuItems execute={execute} setActivePath={setActivePath} children={child._children} parentPath={path} activePath={activePath} />
					)}
				</div>
			);
		})}
	</div>
);