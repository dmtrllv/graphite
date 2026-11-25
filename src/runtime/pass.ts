import type { CompiledPass, PassBufferType } from "../compiler";

export class Pass {
	private readonly device: GPUDevice;
	public readonly pipeline: GPUComputePipeline;
	public readonly pass: CompiledPass;
	private readonly samples: number;

	public constructor(device: GPUDevice, pipeline: GPUComputePipeline, pass: CompiledPass, samples: number) {
		this.device = device;
		this.pipeline = pipeline;
		this.pass = pass;
		this.samples = samples;
	}

	private getBufferElementSize(type: PassBufferType): number {
		switch (type.name) {
			case "value":
				return 4;
			case "vector":
				return type.size === 2 ? 8 : 16;
			case "matrix":
				return type.columns * Math.ceil(type.rows / 4) * 16;
		}
	}

	private createBuffer(samples: number, binding: number): GPUBuffer {
		const input = this.pass.bufferInputs.find(v => v.binding === binding);
		const output = Object.values(this.pass.outputs).find(v => v.binding === binding);

		if (!input && !output)
			throw new Error(`Unknown buffer binding ${binding} in pass "${this.pass.name}"!`);

		if (!Number.isSafeInteger(samples) || samples <= 0)
			throw new Error(`Invalid buffer sample count ${samples}!`);

		const type = input?.type ?? output!.type;
		const size = samples * this.getBufferElementSize(type);

		if (size > this.device.limits.maxStorageBufferBindingSize)
			throw new Error(`Buffer size ${size} exceeds the maximum storage buffer binding size!`);

		return this.device.createBuffer({
			label: `${this.pass.name} Buffer ${binding}`,
			size,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
		});
	}

	public createUniformBuffer() {
		return this.device.createBuffer({
			label: `${this.pass.name} Uniform`,
			size: this.pass.uniform.size,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});
	}

	public record(encoder: GPUCommandEncoder, inputs: GPUBuffer[], uniform: GPUBuffer): GPUBuffer[] {
		if (inputs.length !== this.pass.bufferInputs.length)
			throw new Error(`Invalid input count for pass "${this.pass.name}"!`);

		const outputs = Object.values(this.pass.outputs).map(({ binding }) =>
			this.createBuffer(this.samples, binding)
		);

		const entries: GPUBindGroupEntry[] = [
			...inputs.map((buffer, index) => ({
				binding: this.pass.bufferInputs[index]!.binding,
				resource: { buffer },
			})),
			...outputs.map((buffer, index) => ({
				binding: Object.values(this.pass.outputs)[index]!.binding,
				resource: { buffer },
			})),
			{
				binding: this.pass.uniform.binding,
				resource: { buffer: uniform },
			},
		];

		const bindGroup = this.device.createBindGroup({
			label: `${this.pass.name} Bind Group`,
			layout: this.pipeline.getBindGroupLayout(0),
			entries,
		});

		const computePass = encoder.beginComputePass();
		computePass.setPipeline(this.pipeline);
		computePass.setBindGroup(0, bindGroup);
		computePass.dispatchWorkgroups(
			Math.ceil(this.samples ** 0.5 / 8),
			Math.ceil(this.samples ** 0.5 / 8),
		);
		computePass.end();

		return outputs;
	}
}