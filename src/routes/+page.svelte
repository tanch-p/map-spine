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
      //   resizeTo: document.body,
      width: 256, // default: 800
      height: 256, // default: 600
      backgroundColor: 0x141414,
    });
    if (app === null) return;

    // const sprite = PIXI.Sprite.from("src/lib/enemy_1111_ucommd_2.atlas");
    // console.log(sprite);
    PIXI.Assets.add({
      alias: "ucomm",
      src: "src/lib/enemy_1111_ucommd_2.skel",
      data: { spineSkeletonScale: 0.4 },
    });
    const skel = await PIXI.Assets.load("ucomm");
    const unit = new Spine(skel.spineData);

    unit.x = app.screen.width / 3;
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

<canvas id="app" bind:this={elemCanvas} />
