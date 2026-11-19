import { useRef, useState } from "react";
import { MenuItem, type Menubar } from "@editor";
import { useObservable } from "@reactive";
import { useEvent } from "@hooks";
import { getChildrenAtPath, getFirstItem, getLastItem } from "./utils";
import { MenuItems } from "./items";

import "./styles/menubar.scss";

export const MenuBarView = ({ menubar, autoHide }: { menubar: Menubar, autoHide?: boolean }) => {
	useObservable(menubar);

	const rootRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState(false);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [activePath, setActivePath] = useState<number[]>([]);

	const close = () => {
		setActive(false);
		setActiveIndex(null);
		setIsOpen(false);
		setActivePath([]);
	};

	const execute = (item: MenuItem) => {
		item.action?.(item, menubar);
		close();
	};

	const moveSelection = (direction: number) => {
		if (activeIndex === null)
			return;

		const menu = menubar.items[activeIndex];
		if (!menu)
			return;

		const parentPath = activePath.slice(0, -1);
		const children = getChildrenAtPath(menu, parentPath);
		const currentIndex = activePath.at(-1) ?? (direction > 0 ? -1 : children.length);
		let nextIndex = currentIndex;

		for (let i = 0; i < children.length; i++) {
			nextIndex = (nextIndex + direction + children.length) % children.length;
			if (children[nextIndex] instanceof MenuItem) {
				setActivePath([...parentPath, nextIndex]);
				return;
			}
		}
	};

	const openCurrentMenu = (last = false) => {
		if (activeIndex === null)
			return;

		const menu = menubar.items[activeIndex];
		if (!menu)
			return;

		const index = last ? getLastItem(menu.children) : getFirstItem(menu.children);
		setIsOpen(true);
		setActivePath(index === -1 ? [] : [index]);
	};

	useEvent("keydown", (event: KeyboardEvent) => {
		if (event.key === "Alt") {
			event.preventDefault();
			if (active) {
				close();
			} else {
				setActive(true);
				setActiveIndex(menubar.items.length > 0 ? 0 : null);
				setIsOpen(false);
				setActivePath([]);
			}
			return;
		}

		if (!active)
			return;

		if (event.key === "Tab") {
			close();
			return;
		}

		switch (event.key) {
			case "ArrowRight": {
				event.preventDefault();

				if (isOpen && activeIndex !== null && activePath.length > 0) {
					const menu = menubar.items[activeIndex];
					const item = menu ? getChildrenAtPath(menu, activePath.slice(0, -1))[activePath.at(-1)!] : null;

					if (item instanceof MenuItem && item.children.some(child => child instanceof MenuItem)) {
						const index = getFirstItem(item.children);
						setActivePath([...activePath, index]);
						return;
					}
				}

				if (menubar.items.length > 0) {
					setActiveIndex(index => index === null ? 0 : (index + 1) % menubar.items.length);
					if (isOpen)
						setActivePath([]);
				}
				break;
			}

			case "ArrowLeft": {
				event.preventDefault();

				if (activePath.length > 1) {
					setActivePath(activePath.slice(0, -1));
				} else if (menubar.items.length > 0) {
					setActiveIndex(index => index === null ? 0 : (index - 1 + menubar.items.length) % menubar.items.length);
					if (isOpen)
						setActivePath([]);
				}
				break;
			}

			case "ArrowDown":
				event.preventDefault();
				if (!isOpen)
					openCurrentMenu();
				else
					moveSelection(1);
				break;

			case "ArrowUp":
				event.preventDefault();
				if (!isOpen)
					openCurrentMenu(true);
				else
					moveSelection(-1);
				break;

			case "Enter":
			case " ": {
				event.preventDefault();

				if (!isOpen) {
					openCurrentMenu();
					return;
				}

				if (activeIndex === null)
					return;

				const menu = menubar.items[activeIndex];
				const item = menu ? getChildrenAtPath(menu, activePath.slice(0, -1))[activePath.at(-1)!] : null;

				if (!(item instanceof MenuItem))
					return;

				if (item.children.some(child => child instanceof MenuItem)) {
					const index = getFirstItem(item.children);
					setActivePath([...activePath, index]);
				} else {
					execute(item);
				}
				break;
			}

			case "Escape":
				event.preventDefault();
				if (isOpen) {
					setIsOpen(false);
					setActivePath([]);
				} else {
					close();
				}
				break;
		}
	});

	useEvent("keyup", (e) => {
		if (e.key === "Alt")
			e.preventDefault();
	});

	useEvent("pointerdown", (event: PointerEvent) => {
		if (!rootRef.current?.contains(event.target as Node))
			close();
	});

	const style: React.CSSProperties = {};

	if (!active && autoHide)
		style.marginTop = "-28px";

	return (
		<div ref={rootRef} className={`menu-bar${active ? " active" : ""} ${!active && autoHide ? "hidden" : ""}`} role="menubar" style={style}>
			<div className="icon" />
			{menubar.items.map((item, index) => {
				const onPointerEnter = () => {
					if (active && isOpen) {
						setActiveIndex(index);
						setActivePath([]);
					}
				};
				const onClick = () => {
					if (activeIndex === index && isOpen) {
						setIsOpen(false);
						setActivePath([]);
					} else {
						setActive(true);
						setActiveIndex(index);
						setIsOpen(true);
						setActivePath([]);
					}
				};
				return (
					<div key={item.id} className={`menu-entry${activeIndex === index && active ? " selected" : ""}`} onPointerEnter={onPointerEnter}>
						<button className="menu-entry-button" role="menuitem" aria-haspopup="menu" aria-expanded={activeIndex === index && isOpen} onClick={onClick}>
							{item.text}
						</button>
						{activeIndex === index && isOpen && (
							<MenuItems execute={execute} setActivePath={setActivePath} children={item.children} parentPath={[]} activePath={activePath} />
						)}
					</div>
				)
			})}
		</div>
	);
};
