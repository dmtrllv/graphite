export class RenderScheduler {
	private frame: number | null = null;

	public constructor(private readonly render: () => void) { }

	public invalidate(): void {
		if (this.frame !== null)
			return;

		this.frame = requestAnimationFrame(() => {
			this.frame = null;
			this.render();
		});
	}

	public dispose(): void {
		if (this.frame === null)
			return;

		cancelAnimationFrame(this.frame);
		this.frame = null;
	}
}
