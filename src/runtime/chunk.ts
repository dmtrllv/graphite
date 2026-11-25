export type ChunkID = `${number}-${number}`;

export class Chunk {
	public static readonly createID = (x: number, y: number): ChunkID => `${x}-${y}`
	
	public readonly id: string;

	public readonly buffers: Readonly<Record<string, GPUBuffer>> = {};

	public constructor(id: ChunkID, buffers: Readonly<Record<string, GPUBuffer>>) {
		this.id = id;
		this.buffers = buffers;
	}
}