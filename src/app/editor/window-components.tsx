import type { ComponentType } from "react";
import { GraphEditorView } from "./graph";
import { ProjectList, SaveProjectView } from "./windows/projects";
import { SettingsView } from "./windows/settings";

export const WindowComponents: Record<string, ComponentType<any>> = {
	"graph-editor": GraphEditorView,
	"projects": ProjectList,
	"save-project": SaveProjectView,
	"settings": SettingsView
};
