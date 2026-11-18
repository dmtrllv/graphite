import type { ProjectInfo } from "../../editor/project";
import type { ProjectManager } from "../../editor/project-manager";
import { useObservable } from "../../reactive";
import { mapChildren } from "../../utils";

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