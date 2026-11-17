import { Vec2, type NodeEdge } from "../../../graph";
import { GraphLayout } from "./graph-layout";

export type EdgeGeometry = {
	start: Vec2;
	end: Vec2;
	controlStart: Vec2;
	controlEnd: Vec2;
};

type CachedGeometry = {
	sourceVersion: number;
	targetVersion: number;
	geometry: EdgeGeometry;
};

export class EdgeGeometryCache {
	private cache = new Map<number, CachedGeometry>();

	public get(edge: NodeEdge, layout: GraphLayout): EdgeGeometry | undefined {
		const source = layout.getPort(edge.source, "output", edge.sourceOutput);
		const target = layout.getPort(edge.target, "input", edge.targetInput);

		if (!source || !target)
			return undefined;

		const cached = this.cache.get(edge.id);

		if (cached && cached.sourceVersion === source.version && cached.targetVersion === target.version)
			return cached.geometry;

		const distance = Math.abs(target.position.x - source.position.x);
		const tangent = Math.max(40, distance * 0.5);

		const geometry: EdgeGeometry = {
			start: source.position,
			end: target.position,
			controlStart: new Vec2(source.position.x + tangent, source.position.y),
			controlEnd: new Vec2(target.position.x - tangent, target.position.y)
		};

		this.cache.set(edge.id, {
			sourceVersion: source.version,
			targetVersion: target.version,
			geometry
		});

		return geometry;
	}

	public remove(edge: NodeEdge): void {
		this.cache.delete(edge.id);
	}

	public retain(edges: Iterable<NodeEdge>): void {
		const ids = new Set<number>();

		for (const edge of edges)
			ids.add(edge.id);

		for (const id of this.cache.keys()) {
			if (!ids.has(id))
				this.cache.delete(id);
		}
	}

	public clear(): void {
		this.cache.clear();
	}
}
