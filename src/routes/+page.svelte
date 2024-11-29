<script>
  // import MapViewer from "./MapViewer.svelte";
  import SpineViewer from "./SpineViewer.svelte";


  function handleLoadError(error) {
    console.error("Loading failed:", error);
  }
</script>

<!-- <MapViewer bind:this={mapViewer} levelId ="level_rogue3_b-5" /> -->

<SpineViewer/>