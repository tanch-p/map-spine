<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import * as spine from "$lib/spine";

  let canvasElement: HTMLCanvasElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let rectangle: THREE.Mesh;
  let assetManager: spine.AssetManager;
  let mesh, skeletonMesh;
  var lastFrameTime = Date.now() / 1000;

  onMount(() => {
    // Create scene
    scene = new THREE.Scene();

    // Create camera with adjusted position and rotation
    camera = new THREE.PerspectiveCamera(
      170, // field of view
      4 / 3, // aspect ratio
      0.1, // near clipping plane
      1000 // far clipping plane
    );

    // Position and rotate the camera to create a trapezium-like view
    // camera.position.set(0, -0.5, 10); // Raised up and back

    // Position camera to view XY plane from an angle
    camera.position.set(0, 0, 15); // Directly above, but back
    console.log(camera);
    // camera.rotation.x = 0.194; // Tilt up slightly

    // Create renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true, // Optional: smoother edges
    });
    renderer.setSize(800, 600);

    // Create rectangle geometry
    const geometry = new THREE.PlaneGeometry(2, 1);

    // Create material with some shading to enhance perspective
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    // The X axis is red. The Y axis is green. The Z axis is blue.
    const axesHelper = new THREE.AxesHelper(50);
    axesHelper.position.x = 1;
    axesHelper.position.y = 1;
    axesHelper.position.z = 1;

    scene.add(axesHelper);

    // Create mesh
    rectangle = new THREE.Mesh(geometry, material);
    // Optional: Add a grid to help visualize perspective
    const gridHelper = new THREE.GridHelper(300, 10);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    scene.add(rectangle);

    //! spine here
    assetManager = new spine.AssetManager("/spine/");
    assetManager.loadBinary("enemy_1111_ucommd_2.skel");
    assetManager.loadTextureAtlas("enemy_1111_ucommd_2.atlas");
    requestAnimationFrame(load);

    function load(name, scale) {
      if (assetManager.isLoadingComplete()) {
        // Add a box to the scene to which we attach the skeleton mesh
        let spineMeshGeometry = new THREE.BoxGeometry(500, 500, 500);
        let spineMeshMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
        });
        mesh = new THREE.Mesh(spineMeshGeometry, spineMeshMaterial);
        scene.add(mesh);

        // Load the texture atlas using name.atlas and name.png from the AssetManager.
        // The function passed to TextureAtlas is used to resolve relative paths.
        const atlas = assetManager.get("enemy_1111_ucommd_2.atlas");
        // Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
        const atlasLoader = new spine.AtlasAttachmentLoader(atlas);

        // Create a SkeletonJson instance for parsing the .json file.
        let skeletonBinary = new spine.SkeletonBinary(atlasLoader);

        // Set the scale to apply during parsing, parse the file, and create a new skeleton.
        skeletonBinary.scale = 0.4;
        let skeletonData = skeletonBinary.readSkeletonData(
          assetManager.get("enemy_1111_ucommd_2.skel")
        );

        // Create a SkeletonMesh from the data and attach it to the scene
        skeletonMesh = new spine.SkeletonMesh(skeletonData, (parameters) => {
          parameters.depthTest = true;
          parameters.depthWrite = true;
          parameters.alphaTest = 0.001;
        });

        console.log(skeletonMesh);
        skeletonMesh.state.setAnimation(0, "Move", true);
        mesh.add(skeletonMesh);
        mesh.position.x = -100;
        requestAnimationFrame(render);
      } else requestAnimationFrame(load);
    }

    // Animation function to potentially add subtle movement
    function render(): void {
      // calculate delta time for animation purposes
      var now = Date.now() / 1000;
      var delta = now - lastFrameTime;
      lastFrameTime = now;
      skeletonMesh.update(delta);
      requestAnimationFrame(render);

      mesh.position.x += 0.1;
      renderer.render(scene, camera);
    }

    // Handle window resizing
    const handleResize = (): void => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
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
