import type { Group as InternalGroup } from "../group";
import { Ref } from "./ref";

export class Group<T extends InternalGroup = InternalGroup> extends Ref<T> {

}
