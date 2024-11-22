<script>
  import MapViewer from "./MapViewer.svelte";

  let mapViewer;

  function handleLoadError(error) {
    console.error("Loading failed:", error);
  }
</script>

<MapViewer bind:this={mapViewer} levelId ="level_rogue3_b-5" />
