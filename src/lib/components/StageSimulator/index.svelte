<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import * as spine from "$lib/spine";
  // import config from "$lib/data/level_rogue4_1-1.json";
  // import config from "$lib/ro_stage_data/level_rogue3_1-2.json";
  import config from "$lib/ro_stage_data/level_rogue3_1-5.json";
  import { Game } from "./objects/Game";

  let canvasElement: HTMLCanvasElement;
 
  onMount(() => {
    const game = new Game(config, canvasElement);
  });
</script>

<canvas bind:this={canvasElement}></canvas>

<style>
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    margin: 0 auto;
  }
</style>
