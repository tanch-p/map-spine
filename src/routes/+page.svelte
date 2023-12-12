<script lang="ts">
	import "pixi-spine"; // Do this once at the very start of your code. This registers the loader!
	import * as PIXI from "pixi.js";
	import { Spine } from "pixi-spine";
	import { onMount, onDestroy } from "svelte";

	let elemCanvas: HTMLCanvasElement;
	let app: PIXI.Application;

	onMount(async () => {
		app = new PIXI.Application({
			view: elemCanvas,
			// resizeTo: document.body,
			width: 1200, // default: 800
			height: 800, // default: 600
			backgroundColor: 0x141414,
		});
		if (app === null) return;

		//initialise grids
		const cols = 7;
		const rows = 7;
		const xAdjustment = 1200 / 2 - (cols / 2) * 100;
		const yAdjustment = 800 / 2 - (rows / 2) * 100;
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				const frame = new PIXI.Graphics();
				frame.lineStyle(2, 0xffffff, 1);
				frame.drawRect(j * 100 + xAdjustment, i * 100 + yAdjustment, 100, 100);
				app.stage.addChild(frame);
			}
		}
		// Create window frame

		// const sprite = PIXI.Sprite.from("src/lib/enemy_1111_ucommd_2.atlas");
		// console.log(sprite);
		PIXI.Assets.add({
			alias: "ucomm",
			src: "src/lib/enemy_1111_ucommd_2.skel",
			data: { spineSkeletonScale: 0.4 },
		});
		const skel = await PIXI.Assets.load("ucomm");
		const unit = new Spine(skel.spineData);

		unit.x = 0;
		unit.y = app.screen.height;
		app.stage.addChild(unit);
		unit.scale.x = -1;
		console.log(unit);

		// add the animation to the scene and render...
		if (unit.state.hasAnimation("Move")) {
			// run forever, little boy!
			unit.state.setAnimation(0, "Move", true);
			// update yourself
			unit.autoUpdate = true;
		}
		app.ticker.add((delta) => {
			// delta is 1 if running at 100% performance
			// creates frame-independent transformation
			unit.x += 1 * delta;
		});
	});
	onDestroy(() => {
		// Helps memory leak issues
		if (app) app.stop();
	});
</script>

<canvas id="app" bind:this={elemCanvas} class="mx-auto" />
