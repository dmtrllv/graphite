import { assert } from "@utils";
import { Group } from "./group";
import { SimulationGroup } from "./simulation";

const GroupTypes = {
	Group,
	SimulationGroup,
} as const;

export const getGroupType = (name: string): typeof GroupTypes[keyof typeof GroupTypes] => {
	const type = GroupTypes[name as keyof typeof GroupTypes];
	return assert.notNull(type);
};