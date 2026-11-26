import { Graph } from "./graph";
import { DEFAULT_NODE_TYPES } from "./nodes/types";
import { ValueType } from "./types";

export class World extends Graph<WorldProps> {
	public override get nodeTypes() {
		return DEFAULT_NODE_TYPES;
	}

	public override get outputTypes(): WorldOutput {
		return {
			elevation: ValueType
		};
	}
}

export type WorldProps = {
	
};

export type WorldOutput = {
	elevation: ValueType;
};