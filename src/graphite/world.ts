import { Graph } from "./graph";
import { ValueType } from "./types";

export class World extends Graph<{}, WorldOutputTypes, {}> {
	public override get requiredOutputTypes() {
		return {
			elevation: ValueType
		};
	}

	public override remove(): void {
		throw new Error(`Cannot remove the world graph!`);
	}
}

type WorldOutputTypes = {
    elevation: ValueType;
};