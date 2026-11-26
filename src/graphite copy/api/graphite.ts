import type { Abortable } from "../../utils";
import { Compiler } from "../compiler";
import { GraphManager, type SerializedGraphs } from "../manager";
import { Runtime } from "../runtime";
import type { Chunk } from "../runtime/chunk";
import { WorldGraph } from "./graph";

export class Graphite {
	public static readonly init = async (graphs?: SerializedGraphs) => {
		const manager = new GraphManager(graphs);
		const compiler = new Compiler(manager);
		const runtime = await Runtime.init(compiler);
		return new Graphite(manager, compiler, runtime);
	}

	private readonly manager: GraphManager;
	private readonly compiler: Compiler;
	private readonly runtime: Runtime;
	private readonly unsubscribe: () => void;

	public readonly world: WorldGraph;

	private constructor(manager: GraphManager, compiler: Compiler, runtime: Runtime) {
		this.manager = manager;
		this.compiler = compiler;
		this.runtime = runtime;

		this.world = new WorldGraph(this.manager, this.manager.worldGraph);

		this.unsubscribe = this.manager.subscribe(() => {

		});
	}

	public compile() {
		return this.compiler.compile();
	}

	public async getChunk(x: number, y: number): Promise<Abortable<Chunk>> {
		return this.runtime.resolveChunk(x, y);
	}

	public dispose() {
		this.unsubscribe();
		this.runtime.dispose();
	}
}
