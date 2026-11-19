import { useState } from "react";
import type { ProjectInfo } from "../../../editor/project";
import type { ProjectManager } from "../../../editor/project-manager";
import { useObservable } from "@reactive";
import { mapChildren } from "../../../utils";
import type { Window } from "../../../editor/window";

export const ProjectList = ({ manager }: { manager: ProjectManager }) => {
	const projects = useObservable(manager, { recursive: true }).projects;

	return (
		<div className="project-list">
			<div className="title">Projects</div>
			<div className="list">
				{mapChildren(projects, val => <Item key={val.name} info={val} manager={manager} />)}
			</div>
		</div>
	);
};

const Item = ({ info }: { info: ProjectInfo, manager: ProjectManager }) => {
	return (
		<div className="item">
			<div className="name">
				{info.name}
			</div>
			<div className="date">
				{info.lastSave}
			</div>
		</div>
	);
}

export const SaveProjectView = ({ manager, window }: { manager: ProjectManager, window: Window<any> }) => {
	const [value, setValue] = useState("");

	const save = () => {
		if(value && manager.saveProjectAs(value))
			window.close();
	}

	return (
		<div>
			<input placeholder="Project name" type="text" value={value} onChange={e => setValue(e.target.value)} />
			<button onClick={save}>Save</button>
			<button onClick={() => window.close()}>Cancel</button>
		</div>
	)
}