import { Compiler } from "../compiler/compiler";
import type { CompiledPass, GraphManager } from "../compiler/graph";
import { aborted, assert, isAborted, wrap, type Abortable } from "../utils";
import { Chunk, type ChunkID } from "./chunk";
import { Pass } from "./pass";

export class Runtime {
	public static readonly init = async (manager: GraphManager) => {
		const gpu = assert.notNull(navigator.gpu);
		const adapter = await assert.async.notNull(gpu.requestAdapter());
		const device = await assert.async.notNull(adapter.requestDevice());
		const runtime = new Runtime(manager, gpu, adapter, device);

		console.time();
		await runtime.compile();
		console.timeEnd();

		return runtime;
	}

	private readonly compiler: Compiler;

	private readonly gpu: GPU;
	private readonly adapter: GPUAdapter;
	private readonly device: GPUDevice;

	private readonly chunks = new Map<ChunkID, Chunk>();
	private readonly passes = new Map<CompiledPass, Pass>();

	private uniformBuffer!: GPUBuffer;
	private passOrder: Pass[] = [];
	private worldPass!: Pass;

	public get worldProps() {
		return this.compiler.manager.worldGraph.props;
	}

	public get worldChunks() {
		return Math.ceil(this.worldProps.worldSize / this.worldProps.chunkSize);
	}

	private constructor(manager: GraphManager, gpu: GPU, adapter: GPUAdapter, device: GPUDevice) {
		this.compiler = new Compiler(manager);
		this.gpu = gpu;
		this.adapter = adapter;
		this.device = device;
	}

	public async compile() {
		this.dispose();

		const result = await this.compiler.compile(true);

		if (isAborted(result))
			return;

		const samples = this.worldProps.chunkSize ** 2;

		const { compilation, worldPass, compilationId } = result;

		const passes = await Promise.all(compilation.passes.values().map(async passPromise => {
			const pass = await passPromise;

			const shader = await this.device.createShaderModule({ label: `${pass.name} Pass`, code: pass.source });

			const bindGroupLayout = this.createPassBindGroupLayout(pass);

			const pipeline = this.device.createComputePipeline({
				layout: this.device.createPipelineLayout({
					bindGroupLayouts: [bindGroupLayout],
				}),
				compute: {
					module: shader,
					entryPoint: "main",
				},
			});

			return new Pass(this.device, pipeline, pass, samples);
		}));

		this.worldPass = passes.find((p) => p.pass === worldPass)!;
		this.uniformBuffer = this.worldPass.createUniformBuffer();

		if (this.compiler.lastCompilationId !== compilationId)
			return;

		passes.forEach(pass => this.passes.set(pass.pass, pass));

		const visited = new Set<CompiledPass>();

		const visit = (compiled: CompiledPass) => {
			if (visited.has(compiled))
				return;

			visited.add(compiled);

			for (const dependency of compiled.dependencies)
				visit(dependency);

			this.passOrder.push(assert.notNull(this.passes.get(compiled)));
		};

		for (const compiled of this.passes.keys())
			visit(compiled);
	}

	private createPassBindGroupLayout(pass: CompiledPass): GPUBindGroupLayout {
		const entries: GPUBindGroupLayoutEntry[] = [
			...pass.bufferInputs.map(({ binding }) => ({
				binding,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: "read-only-storage" as const,
				},
			})),
			...Object.values(pass.outputs).map(({ binding }) => ({
				binding,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: "storage" as const,
				},
			})),
			{
				binding: Math.max(
					-1,
					...pass.bufferInputs.map(({ binding }) => binding),
					...Object.values(pass.outputs).map(({ binding }) => binding),
				) + 1,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: "uniform",
				},
			},
		];

		return this.device.createBindGroupLayout({
			label: `${pass.name} Bind Group Layout`,
			entries,
		});
	}

	private dispose() {
		this.chunks.clear();
		this.passes.clear();
		this.passOrder = [];
	}

	public worldToChunk(x: number, y: number): [number, number] {
		const size = this.worldProps.worldSize;
		x = wrap(x, size);
		y = wrap(y, size);

		const chunkX = Math.floor(x / this.worldProps.chunkSize);
		const chunkY = Math.floor(y / this.worldProps.chunkSize);
		return [chunkX, chunkY];
	}

	private getBufferKey(ref: { graphId: number; bufferKey: string }): string {
		return `${ref.graphId}:${ref.bufferKey}`;
	}

	// takes chunk coordinates
	public async resolveChunk(x: number, y: number): Promise<Abortable<Chunk>> {
		x = wrap(x, this.worldChunks);
		y = wrap(y, this.worldChunks);

		const id = Chunk.createID(x, y);

		if (!this.chunks.has(id)) {
			const commandEncoder = this.device.createCommandEncoder();
			const buffers = new Map<string, GPUBuffer>();

			for (const pass of this.passOrder) {
				const inputs = pass.pass.bufferInputs.map(({ ref }) => assert.notNull(buffers.get(this.getBufferKey(ref))));
				const outputs = pass.record(commandEncoder, inputs, this.uniformBuffer);

				Object.values(pass.pass.outputs).forEach(({ ref }, index) => {
					buffers.set(this.getBufferKey(ref), assert.notNull(outputs[index]));
				});
			}

			const worldBuffers: Record<string, GPUBuffer> = {};

			for (const name in this.worldPass.pass.outputs) {
				const { ref } = this.worldPass.pass.outputs[name]!;
				worldBuffers[name] = buffers.get(this.getBufferKey(ref))!;
			}

			this.chunks.set(id, new Chunk(id, worldBuffers));

			this.device.queue.submit([commandEncoder.finish()]);
			const completion = this.device.queue.onSubmittedWorkDone();
			const compilationId = this.compiler.lastCompilationId;

			return completion.then(() => {
				if (compilationId !== this.compiler.lastCompilationId)
					return aborted();
				return this.chunks.get(id)!;
			});
		}

		return this.chunks.get(id)!;
	}

	public async readBuffer(buffer: GPUBuffer): Promise<ArrayBuffer> {
		const readback = this.device.createBuffer({
			size: buffer.size,
			usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
		});

		const encoder = this.device.createCommandEncoder();
		encoder.copyBufferToBuffer(buffer, 0, readback, 0, buffer.size);
		this.device.queue.submit([encoder.finish()]);

		await readback.mapAsync(GPUMapMode.READ);

		const data = readback.getMappedRange().slice(0);

		readback.unmap();
		readback.destroy();

		return data;
	}
}
