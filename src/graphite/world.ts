import { Graph } from "./graph";
import { ValueType } from "./types";

export class World extends Graph<{}, WorldOutputTypes, {}> {
	public override get requiredOutputTypes() {
		return {
			elevation: ValueType
		};
	}
}

type WorldOutputTypes = {
    elevation: ValueType;
};