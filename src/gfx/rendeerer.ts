import { assert } from "../utils";
import { Canvas } from "./canvas";

export class Renderer {
	public static readonly new = async () => {
		const gpu = assert.notNull(navigator.gpu);
		const adapter = assert.notNull(await gpu.requestAdapter({ powerPreference: "high-performance" }));
		const device = await adapter.requestDevice();
		return new Renderer(gpu, adapter, device);
	};

	private readonly gpu: GPU;
	
	public readonly canvas: Canvas;
	public readonly adapter: GPUAdapter;
	public readonly device: GPUDevice;

	public constructor(gpu: GPU, adapter: GPUAdapter, device: GPUDevice) {
		this.canvas = new Canvas();
		this.gpu = gpu;
		this.adapter = adapter;
		this.device = device;
	}
}