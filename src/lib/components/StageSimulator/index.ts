let stage: StageScene;
  let assetManager: spine.AssetManager;
  let mesh, skeletonMesh;
  var lastFrameTime = Date.now() / 1000;

  const objects = [];

  onMount(() => {
    const rows = mapConfig.mapData.map.length;
    const cols = mapConfig.mapData.map[0].length;
    const gridSize = 60;
    stage = new StageScene(canvasElement, gridSize, rows, cols);

    // The X axis is red. The Y axis is green. The Z axis is blue.
    const axesHelper = new THREE.AxesHelper(50);
    axesHelper.position.x = 350;
    axesHelper.position.y = -250;
    axesHelper.position.z = 0;

    stage.scene.add(axesHelper);

    // Optional: Add a grid to help visualize perspective
    // const gridHelper = new MapGrids(
    //   gridCols * 60,
    //   gridRows * 60,
    //   gridCols,
    //   gridRows
    // );
    // gridHelper.rotation.x = Math.PI / 2;
    // stage.scene.add(gridHelper);

    //! spine here
    assetManager = new spine.AssetManager("/spine/");
    assetManager.loadBinary("enemy_1111_ucommd_2.skel");
    assetManager.loadTextureAtlas("enemy_1111_ucommd_2.atlas");

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
        stage.scene.add(mesh);
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
        stage.renderer.setAnimationLoop(() => stage.render());
        // stage.renderer.setAnimationLoop(() =>
        //   render(stage.renderer, stage.scene, stage.camera)
        // );
      } else requestAnimationFrame(load);
    }
    function render(renderer, scene, camera) {
      renderer.render(scene, camera);
    }

    // Cleanup
    return () => {
      stage.renderer.dispose();
    };
  });