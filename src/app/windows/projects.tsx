import { useState } from "react";
import { useObservable } from "@reactive";
import { cn, mapChildren } from "@utils";
import { Window, type WindowComponent } from "../layout";
import { TextInput } from "../ui/inputs/text";
import { GraphEditorWindow } from "../editor/graph/editor-view";

import "./styles/projects.scss";

const ProjectManagerView: WindowComponent<{ openSidebar?: boolean }> = ({ window, app, openSidebar = false }) => {
	const projectManager = useObservable(app.projectManager, { recursive: true });
	const projects = projectManager.projects;

	const [isSidebarOpen, setSidebarOpen] = useState(openSidebar);

	const [name, setName] = useState("");

	const load = (name: string) => projectManager.load(name).then(project => {
		if (project) {
			app.windowManager.open(GraphEditorWindow, { title: "World", graph: project.graphs.world });
			window.close(true);
		}
	});

	const create = () => projectManager.create(name, false).then(ok => { ok && load(name); });

	return (
		<div className="project-manager">
			<div className="body">
				{projects.length === 0 && (
					<>
						<h3>No projects here yet!</h3>
						<button onClick={() => setSidebarOpen(true)}>Create new project</button>
					</>
				)}
				<button onClick={() => setSidebarOpen(true)}>New</button>
				{mapChildren(projects, val => (
					<div className="item" onClick={() => load(val.name)}>
						<div className="name">
							{val.name}
						</div>
						<div className="date">
							{val.saved}
						</div>
					</div>
				))}
			</div>
			<div className={cn("overlay", { active: isSidebarOpen })} onClick={() => setSidebarOpen(false)}>
				<div className={"sidebar"} onClick={e => e.stopPropagation()}>
					<TextInput label="Name" value={name} onChange={setName} />
					<button onClick={create}>Create</button>
				</div>
			</div>
		</div>
	);
};

const SaveProjectView: WindowComponent = ({ window, app }) => {
	const [value, setValue] = useState("");

	const save = () => {
		if (value && app.projectManager.saveAs(value))
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

export const ProjectManagerWindow = Window.create({
	title: "Projects",
	singleInstance:
		true,
	dockable: false,
	isClosable: (editor) => !!editor.projectManager.loadedProject
}, ProjectManagerView);

export const SaveProjectWindow = Window.create({
	title: "Save Project",
	singleInstance: true,
	dockable: false
}, SaveProjectView);
