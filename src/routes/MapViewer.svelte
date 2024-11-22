<script>
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
  import * as spine from "@esotericsoftware/spine-threejs";

  // Props
  export let levelId = "";

  let scene, camera, renderer;
  let geometry, material, mesh, skeletonMesh;
  let assetManager;
  let canvas;
  let controls;
  let lastFrameTime = Date.now() / 1000;

  let baseUrl = "/spine/";
  let skeletonFile = "enemy_1111_ucommd_2.skel";
  let atlasFile = "enemy_1111_ucommd_2.atlas";
  let animation = "walk";

  function init() {
    // create the THREE.JS camera, scene and renderer (WebGL)
    let width = window.innerWidth,
      height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 1, 3000);
    camera.position.y = 100;
    camera.position.z = 400;
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);
    canvas = renderer.domElement;

    // load the assets required to display the Raptor model
    assetManager = new spine.AssetManager(baseUrl);
    assetManager.loadBinary(skeletonFile);
    assetManager.loadTextureAtlas(atlasFile);

    requestAnimationFrame(load);
  }

  function load(name, scale) {
    if (assetManager.isLoadingComplete()) {
      // Add a box to the scene to which we attach the skeleton mesh
      geometry = new THREE.BoxGeometry(200, 200, 200);
      material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
      });
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Load the texture atlas using name.atlas and name.png from the AssetManager.
      // The function passed to TextureAtlas is used to resolve relative paths.
      const atlas = assetManager.require(atlasFile);

      // Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
      const atlasLoader = new spine.AtlasAttachmentLoader(atlas);

      // Create a SkeletonJson instance for parsing the .json file.
      console.log(atlasLoader)
      let skeletonJson = new spine.SkeletonBinary(atlasLoader);
      
      // Set the scale to apply during parsing, parse the file, and create a new skeleton.
      skeletonJson.scale = 0.4;
      let skeletonData = skeletonJson.readSkeletonData(
        assetManager.require(skeletonFile)
      );

      // Create a SkeletonMesh from the data and attach it to the scene
      skeletonMesh = new spine.SkeletonMesh(skeletonData, (parameters) => {
        parameters.depthTest = true;
        parameters.depthWrite = true;
        parameters.alphaTest = 0.001;
      });
      skeletonMesh.state.setAnimation(0, animation, true);
      mesh.add(skeletonMesh);

      requestAnimationFrame(render);
    } else requestAnimationFrame(load);
  }

  let lastTime = Date.now();
  function render() {
    // calculate delta time for animation purposes
    let now = Date.now() / 1000;
    let delta = now - lastFrameTime;
    lastFrameTime = now;

    // resize canvas to use full page, adjust camera/renderer
    resize();

    // Update orbital controls
    controls.update();

    // update the animation
    skeletonMesh.update(delta);

    // render the scene
    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  function resize() {
    let w = window.innerWidth;
    let h = window.innerHeight;
    if (canvas.width != w || canvas.height != h) {
      canvas.width = w;
      canvas.height = h;
    }

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
  }
  onMount(() => {
    init();
  });
</script>

// SpineViewer.svelte
<canvas id="canvas"></canvas>
