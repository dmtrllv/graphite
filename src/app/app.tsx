import { GraphManager } from "../graph";
import { useStore } from "../reactive";
import { GraphRenderer } from "./graph-renderer";

export const App = () => {
	const graphManager = useStore(GraphManager);

	const graph = graphManager.get("Test");

	return (
		<GraphRenderer graph={graph} />
	);
};
