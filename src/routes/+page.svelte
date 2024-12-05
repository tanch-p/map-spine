<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import * as spine from "$lib/spine";
  import mapConfig from "$lib/data/level_rogue3_b-5.json";
  import { MapGrids } from "$lib/components/MapGrids";
  import { StageScene } from "$lib/components/StageSimulator/objects/StageScene";
  import VoxelPainter from "$lib/components/VoxelPainter/index.svelte";

  let canvasElement: HTMLCanvasElement;
</script>

<VoxelPainter />
<!-- <canvas bind:this={canvasElement}></canvas> -->

<style>
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    margin: 0 auto;
  }
</style>
