<script lang="ts">
  import "pixi-spine"; // Do this once at the very start of your code. This registers the loader!
  import * as PIXI from "pixi.js";
  import { Spine } from "pixi-spine";
  import { onMount, onDestroy } from "svelte";

  let elemCanvas: HTMLCanvasElement;
  let app: PIXI.Application;
  let renderer: PIXI.Renderer;
  let mapData;
  let timeline;
  let time = 0;

  onMount(async () => {
    renderer = new PIXI.Renderer();
    app = new PIXI.Application({
      view: elemCanvas,
      // resizeTo: document.body,
      width: 1200, // default: 800
      height: 800, // default: 600
      backgroundColor: 0x141414,
    });
    if (!app) return;

    try {
      mapData = (await import("$lib/data/level_rogue3_1-3.json")).default;
      timeline = (await import("$lib/data/test.json")).default;
      timeline = timeline["20"][0].waves[0].timeline;
    } catch (err) {
      console.error(err);
      return;
    }
    console.log(mapData);

    //initialise grids
    const gridSize = 80; //px
    const cols = mapData.mapData.map[0].length;
    const rows = mapData.mapData.map.length;
    const xAdjustment = 1200 / 2 - (cols / 2) * gridSize;
    const yAdjustment = 800 / 2 - (rows / 2) * gridSize;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const frame = new PIXI.Graphics();
        frame.lineStyle(2, 0xffffff, 1);
        frame.drawRect(
          j * gridSize + xAdjustment,
          rows - i * gridSize + yAdjustment + 450,
          gridSize,
          gridSize
        );
        const texture = renderer.generateTexture(frame);
        const sprite = new PIXI.Sprite(texture);
        sprite.position.x = j * gridSize + xAdjustment;
        sprite.position.y = rows - i * gridSize + yAdjustment + 450;
        sprite.anchor.x = 0;
        sprite.anchor.y = 0;
        sprite.onclick = (event) => {
          alert(`${i},${j}`);
        };
        sprite.eventMode = "static";
        app.stage.addChild(sprite);
        app.stage.addChild(frame);
      }
    }

    PIXI.Assets.add({
      alias: "ucomm",
      src: "/spine/enemy_1111_ucommd_2.skel",
      data: { spineSkeletonScale: 0.2 },
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
    setTimeout(() => {
      unit.state.setAnimation(0, "Idile", true);
    }, 3000);
    console.log(app.ticker.FPS);
    app.ticker.add((delta) => {
      // delta is 1 if running at 100% performance
      // creates frame-independent transformation
      unit.x += 1 * delta;
    });
    setTimeout(() => {
      app.stop();
    }, 10000);
  });
  onDestroy(() => {
    // Helps memory leak issues
    if (app) {
      app.stop();
    }
  });
</script>

<canvas id="app" bind:this={elemCanvas} class="mx-auto" />
