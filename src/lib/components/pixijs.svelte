<script lang="ts">
    import "pixi-spine"; // Do this once at the very start of your code. This registers the loader!
    import { Spine } from "pixi-spine";
    import * as PIXI from "pixi.js";
    import { onMount, onDestroy } from "svelte";
    import { Map } from "$lib/objects/Map";
  
    let elemCanvas: HTMLCanvasElement;
    let app: PIXI.Application;
    let mapContainer: PIXI.Container;
    let renderer: PIXI.Renderer;
    let mapData;
    let timeline;
    let time = 0;
  
    // Start loading right away and create a promise
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
      const texturePromise = PIXI.Assets.load(
        "../../src/lib/images/level_ro3_b_5.webp"
      );
      try {
        mapData = (await import("$lib/data/level_rogue3_b-5.json")).default;
        timeline = (await import("$lib/data/test.json")).default;
        timeline = timeline["20"][0].waves[0].timeline;
      } catch (err) {
        console.error(err);
        return;
      }
      console.log(mapData);
  
      mapContainer = new PIXI.Container();
      await texturePromise.then((resolvedTexture) => {
        // create a new Sprite from the resolved loaded Texture
        const stage = PIXI.Sprite.from(resolvedTexture);
  
        // center the sprite's anchor point
        stage.anchor.set(0.5);
  
        // move the sprite to the center of the screen
        stage.x = app.screen.width / 2;
        stage.y = app.screen.height / 2;
        app.stage.addChild(stage);
      });
      const map = new Map({ container: mapContainer, mapData: mapData.mapData });
      app.stage.addChild(mapContainer);
  
      // Move container to the center
      mapContainer.x = app.screen.width / 2;
      mapContainer.y = app.screen.height / 2;
  
      // mapContainer.skew.y = Math.PI / 0;
      mapContainer.skew.x = 0;
  
      // Center sprite in local container coordinates
      mapContainer.pivot.x = mapContainer.width / 2;
      mapContainer.pivot.y = mapContainer.height / 2;
  
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
  