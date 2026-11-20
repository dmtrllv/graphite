import { observable } from "@reactive";
import { Serializable, serializable } from "../serializable";
import { Vec2 } from "./types";

@observable
@serializable({ type: "graph:viewport", create: () => new GraphViewport() })
export class GraphViewport extends Serializable {
	@observable
	@serializable(Vec2)
	public accessor offset = new Vec2();

	@observable
	@serializable(Number)
	public accessor scale = 1;

	public getCanvasMousePosition(position: Vec2, canvas: HTMLCanvasElement): Vec2 {
		const rect = canvas.getBoundingClientRect();

		return new Vec2(
			(position.x - rect.left - rect.width / 2 - this.offset.x) / this.scale,
			(rect.height / 2 - (position.y - rect.top) - this.offset.y) / this.scale
		);
	}
}
