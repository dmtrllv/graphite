import { Graph } from "./graph";
import type { PassBufferType } from "./types";

export class Pass<I extends PassIOTypes = PassIOTypes, O extends PassIOTypes = PassIOTypes, State extends {} = {}> extends Graph<I, O, State> {

}

export type PassIOTypes = Record<string, PassBufferType>;