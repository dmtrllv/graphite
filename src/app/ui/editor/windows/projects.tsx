import { useState } from "react";
import type { ProjectInfo } from "@editor/project";
import type { ProjectManager } from "@editor/project-manager";
import { useObservable } from "@reactive";
import { mapChildren } from "@utils";
import { Window, type WindowComponent } from "@editor/layout";

const ProjectList: WindowComponent = ({ editor }) => {
	const projects = useObservable(editor.projectManager, { recursive: true }).projects;

	return (
		<div className="project-list">
			<div className="title">Projects</div>
			<div className="list">
				{mapChildren(projects, val => <Item key={val.name} info={val} manager={editor.projectManager} />)}
			</div>
		</div>
	);
};

export const ProjectManagerWindow = Window.create({ title: "Projects", singleInstance: true, dockable: false }, ProjectList);

const Item = ({ info }: { info: ProjectInfo, manager: ProjectManager }) => {
	return (
		<div className="item">
			<div className="name">
				{info.name}
			</div>
			<div className="date">
				{info.saved}
			</div>
		</div>
	);
}


const SaveProjectView: WindowComponent = ({ window, editor }) => {
	const [value, setValue] = useState("");

	const save = () => {
		if (value && editor.projectManager.saveAs(value))
			window.close();
	}

	return (
		<div>
			<input placeholder="Project name" type="text" value={value} onChange={e => setValue(e.target.value)} />
			<button onClick={save}>Save</button>
			<button onClick={() => window.close()}>Cancel</button>
		</div>
	)
};

export const SaveProjectWindow = Window.create({ title: "Save Project", singleInstance: true, dockable: false }, SaveProjectView);
