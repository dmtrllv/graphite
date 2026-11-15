export class Canvas {
	public readonly element: HTMLCanvasElement;
	
	public constructor() {
		this.element = document.createElement("canvas");
	}
}