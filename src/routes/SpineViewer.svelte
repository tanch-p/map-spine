<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import * as spine from "$lib/spine";
  import mapConfig from "$lib/data/level_rogue3_b-5.json";
  import { MapGrids } from "$lib/components/MapGrids";

  let canvasElement: HTMLCanvasElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let raycaster: THREE.raycaster;
  let pointer: THREE.Vector2;
  let assetManager: spine.AssetManager;

  let mesh, skeletonMesh;
  var lastFrameTime = Date.now() / 1000;

  const objects = [];

  onMount(() => {
    // Create scene
    scene = new THREE.Scene();
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    // Create camera with adjusted position and rotation
    camera = new THREE.PerspectiveCamera(
      75, // field of view
      4 / 3, // aspect ratio
      0.1, // near clipping plane
      1000 // far clipping plane
    );

    // Position and rotate the camera to create a trapezium-like view

    // Position camera to view XY plane from an angle
    camera.position.y = 0;
    camera.position.z = 400;
    // camera.rotation.x = 0.194; // Tilt up slightly

    // Create renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true, // Optional: smoother edges
      alpha: true,
    });
    renderer.setClearColor(0x0000, 1);
    renderer.setSize(800, 600);

    // The X axis is red. The Y axis is green. The Z axis is blue.
    const axesHelper = new THREE.AxesHelper(50);
    axesHelper.position.x = 350;
    axesHelper.position.y = -250;
    axesHelper.position.z = 0;

    scene.add(axesHelper);

    const gridRows = mapConfig.mapData.map.length;
    const gridCols = mapConfig.mapData.map[0].length;
    // Optional: Add a grid to help visualize perspective
    const gridHelper = new MapGrids(
      gridCols * 60,
      gridRows * 60,
      gridCols,
      gridRows
    );
    // gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    //! spine here
    assetManager = new spine.AssetManager("/spine/");
    assetManager.loadBinary("enemy_1111_ucommd_2.skel");
    assetManager.loadTextureAtlas("enemy_1111_ucommd_2.atlas");
    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mousedown", onPointerDown);

    requestAnimationFrame(load);

    function load(name, scale) {
      if (assetManager.isLoadingComplete()) {
        // Add a box to the scene to which we attach the skeleton mesh
        let spineMeshGeometry = new THREE.BoxGeometry(50, 50, 50);
        let spineMeshMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          // wireframe: true,
          visible: false,
        });
        mesh = new THREE.Mesh(spineMeshGeometry, spineMeshMaterial);
        scene.add(mesh);
        objects.push(mesh);

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

        skeletonMesh.state.setAnimation(0, "Move", true);
        mesh.add(skeletonMesh);
        mesh.position.x = -100;
        renderer.setAnimationLoop(render);
      } else requestAnimationFrame(load);
    }

    // Animation function to potentially add subtle movement
    function render(): void {
      // calculate delta time for animation purposes
      var now = Date.now() / 1000;
      var delta = now - lastFrameTime;
      lastFrameTime = now;
      skeletonMesh.update(delta);

      mesh.position.x += 0.1;
      renderer.render(scene, camera);
    }
    function onPointerMove(event) {
      pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / 600) * 2 + 1
      );
      // console.log(pointer);
      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(objects, false);
      if (intersects.length > 0) {
        // console.log(intersects);
        //   const intersect = intersects[0];
        //   rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
        //   render();
      }
    }
    function onPointerDown(event) {
      pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / 600) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(objects, false);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        // console.log("hi");
      }
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
