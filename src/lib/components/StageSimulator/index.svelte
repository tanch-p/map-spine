<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import * as spine from "$lib/spine";
  import config from "$lib/data/level_rogue4_1-1.json";
  // import config from "$lib/ro_stage_data/level_rogue3_1-2.json";
  // import config from "$lib/ro_stage_data/level_rogue3_1-5.json";
  import { Game } from "./objects/Game";

  let canvasElement: HTMLCanvasElement;

  onMount(() => {
    const game = new Game(config, canvasElement);
  });
</script>

<div id="game-div">
  <canvas bind:this={canvasElement}></canvas>
</div>

<style>
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    margin: 0 auto;
  }

  .countdown-container {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none; /* Prevent interactions */
}

.countdown-timer {
  transform: rotate(-90deg); /* Rotate to make progress start from the top */
}

.countdown-circle {
  transition: stroke-dashoffset 0.1s linear; /* Smooth animation */
}
</style>
