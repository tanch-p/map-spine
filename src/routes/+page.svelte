<script lang="ts">
  import "pixi-spine"; // Do this once at the very start of your code. This registers the loader!
  import * as PIXI from "pixi.js";
  import { Spine } from "pixi-spine";
  import { onMount, onDestroy } from "svelte";
  import { Map } from "$lib/objects/Map";
  import { Interface } from "$lib/objects/Interface";

  let elemCanvas: HTMLCanvasElement;
  let app: PIXI.Application;
  let mapContainer: PIXI.Container;
  let renderer: PIXI.Renderer;
  let mapData;
  let timeline;
  let time = 0;
  let action = "Idile";

  onMount(async () => {
    renderer = new PIXI.Renderer();
    app = new PIXI.Application({
      view: elemCanvas,
      // resizeTo: document.body,
      width: 900, // default: 800
      height: 600, // default: 600
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
    // console.log(mapData);

    mapContainer = new PIXI.Container();
    // const map = new Map({ container: mapContainer, mapData: mapData.mapData });
    app.stage.addChild(mapContainer);

    // Move container to the center
    mapContainer.x = app.screen.width / 2;
    mapContainer.y = app.screen.height / 2;

    // Center sprite in local container coordinates
    mapContainer.pivot.x = mapContainer.width / 2;
    mapContainer.pivot.y = mapContainer.height / 2;

    PIXI.Assets.add({
      alias: "ucomm",
      src: "/spine/enemy_1111_ucommd_2.skel",
      data: { spineSkeletonScale: 1 },
    });
    const skel = await PIXI.Assets.load("ucomm");
    const unit = new Spine(skel.spineData);
    unit.x = app.screen.width / 2;
    unit.y = app.screen.height;
    app.stage.addChild(unit);
    const ui = new Interface({ container: mapContainer, unit: unit });
    // add the animation to the scene and render...
    if (unit.state.hasAnimation("Move")) {
      // run forever, little boy!
      unit.state.setAnimation(0, "Move", true);
      // update yourself
      unit.autoUpdate = true;
    }
    console.log(app.ticker.FPS);
    // app.ticker.add((delta) => {
    //   // delta is 1 if running at 100% performance
    //   // creates frame-independent transformation
    //   unit.x += 1 * delta;
    // });
  });
  onDestroy(() => {
    // Helps memory leak issues
    if (app) {
      app.stop();
    }
  });
</script>

<canvas id="app" bind:this={elemCanvas} class="mx-auto" />
