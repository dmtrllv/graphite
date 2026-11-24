import { Node } from "./node";

export class GraphOutputNode extends Node<{ graphId: number }> {}

export class GraphInputNode extends Node<{ graphId: number; inputName: string; }> {}