import { Node } from "./node";

export class GraphInputNode extends Node<{ graphId: number; inputName: string; }> {
	
}

export class GraphOutputNode extends Node<{ graphId: number }> {
	
}
