import { GraphManager } from "../graph";
import { useStore } from "../reactive";
import { GraphRenderer } from "./graph/graph-renderer";

export const App = () => {
	const graphManager = useStore(GraphManager);
	const graph = graphManager.get("Test");

	if (!graph)
		return null;

	const editor = graphManager.openEditor(graph);

	return <GraphRenderer editor={editor} />;
};
