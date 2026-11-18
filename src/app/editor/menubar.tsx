import type { Menubar } from "../../editor/menubar";
import { useObservable } from "../../reactive";

import "./styles/menubar.scss";

export const MenuBarView = ({ menubar }: { menubar: Menubar }) => {
	useObservable(menubar);

	return (
		<div className="menu-bar">
			
		</div>
	);
};