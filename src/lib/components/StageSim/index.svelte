<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import * as spine from "$lib/spine";
  import {
    convertMovementConfig,
    gameToPos,
    getNormalPos,
    normalToPos,
    setPosition,
  } from "$lib/functions/lib";
  import {Theta} from "$lib/components/StageSimulator/objects/Theta"

  // export let canvasElement: HTMLCanvasElement;

  const movementConfig = {
    motionMode: "WALK",
    startPosition: {
      row: 7,
      col: 1,
    },
    endPosition: {
      row: 6,
      col: 11,
    },
    checkpoints: [
      {
        type: "MOVE",
        time: 0.0,
        position: {
          row: 2,
          col: 2,
        },
        reachOffset: {
          x: 0.0,
          y: 0.0,
        },
      },
      {
        type: "MOVE",
        time: 0.0,
        position: {
          row: 2,
          col: 4,
        },
        reachOffset: {
          x: 0.0,
          y: 0.0,
        },
      },
      {
        type: "MOVE",
        time: 0.0,
        position: {
          row: 6,
          col: 5,
        },
        reachOffset: {
          x: 0.0,
          y: 0.0,
        },
      },
      {
        type: "MOVE",
        time: 0.0,
        position: {
          row: 6,
          col: 7,
        },
        reachOffset: {
          x: 0.0,
          y: 0.0,
        },
      },
      {
        type: "MOVE",
        time: 0.0,
        position: {
          row: 2,
          col: 8,
        },
        reachOffset: {
          x: 0.0,
          y: 0.0,
        },
      },
      {
        type: "MOVE",
        time: 0.0,
        position: {
          row: 2,
          col: 10,
        },
        reachOffset: {
          x: 0.0,
          y: 0.0,
        },
      },
    ],
    allowDiagonalMove: true,
  };

  const mazeLayout = [
    [1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  class MazeController {
    constructor(mazeLayout, movementConfig, bot, gridSize = 1) {
      this.mazeLayout = mazeLayout;
      this.pathFinder = new Theta(mazeLayout);
      this.config = convertMovementConfig(movementConfig, mazeLayout);
      this.checkpointIndex = 0;
      this.currentPathIndex = 0;
      this.path = [];
      this.isWaiting = false;
      this.waitStartTime = 0;
      this.mazeHeight = mazeLayout.length;
      this.mazeWidth = mazeLayout[0].length;
      this.detailedPath = [];
      this.waypointMarkers = [];

      // Three.js specific properties
      this.bot = bot;
      this.gridSize = gridSize;
      this.moveSpeed = 2.0;
      this.movementProgress = 0;
      const startPos = gameToPos(
        [movementConfig.startPosition.col, movementConfig.startPosition.row],
        mazeLayout,
        gridSize
      );
      const endPos = gameToPos(
        [movementConfig.startPosition.col, movementConfig.startPosition.row],
        mazeLayout,
        gridSize
      );
      this.startPos = new THREE.Vector3(startPos.posX, startPos.posY, 0);
      this.targetPos = new THREE.Vector3(endPos.posX, endPos.posY, 0);

      this.calculatePath();
      this.visualizePath();
    }

    calculatePath() {
      this.detailedPath = [];
      const waypoints = [
        this.config.startPosition,
        ...this.config.checkpoints.map((cp) => cp.position),
        this.config.endPosition,
      ];
      // Calculate path between each consecutive waypoint using Theta* algorithm
      for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];
        const pathSegment = this.pathFinder.findPath(start, end);
        
        if (pathSegment) {
          this.detailedPath.push(
            ...(i === 0 ? pathSegment : pathSegment.slice(1))
          );
        }
      }
      console.log(this.detailedPath);
    }

    

    visualizePath() {
      // Remove existing path visualization if any
      if (this.pathLine) {
        scene.remove(this.pathLine);
      }
      this.waypointMarkers.forEach((marker) => scene.remove(marker));
      this.waypointMarkers = [];

      // Create path line
      const points = this.detailedPath.map((pos) => {
        return new THREE.Vector3(
          getNormalPos(pos.col, this.mazeLayout, gridSize, "x"),
          getNormalPos(pos.row, this.mazeLayout, gridSize, "y"),
          0.2
        );
      });

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 2,
      });
      this.pathLine = new THREE.Line(geometry, material);
      scene.add(this.pathLine);

      // Add waypoint markers
      const waypointGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const waypointMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });

      // Checkpoints
      this.config.checkpoints.forEach((checkpoint) => {
        const marker = new THREE.Mesh(waypointGeometry, waypointMaterial);
        marker.position.set(
          getNormalPos(checkpoint.position.col, this.mazeLayout, gridSize, "x"),
          getNormalPos(checkpoint.position.row, this.mazeLayout, gridSize, "y"),
          0.2
        );
        this.waypointMarkers.push(marker);
        scene.add(marker);
      });

      // Add progress line
      this.updateProgressLine();
    }

    updateProgressLine() {
      // Remove existing progress line if any
      if (this.progressLine) {
        scene.remove(this.progressLine);
      }

      // Create progress line (showing completed path)
      const progressPoints = this.detailedPath
        .slice(0, this.currentPathIndex + 1)
        .map((pos) => {
          return new THREE.Vector3(
            getNormalPos(pos.col, this.mazeLayout, gridSize, "x"),
            getNormalPos(pos.row, this.mazeLayout, gridSize, "y"),
            0.2
          );
        });

      if (progressPoints.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(
          progressPoints
        );
        const material = new THREE.LineBasicMaterial({
          color: 0x0000ff,
          linewidth: 3,
        });
        this.progressLine = new THREE.Line(geometry, material);
        scene.add(this.progressLine);
      }
    }

    moveObject() {
      if (this.currentPathIndex >= this.detailedPath.length - 1) {
        this.isMoving = false;
        return;
      }

      const currentPathPos = this.detailedPath[this.currentPathIndex];
      const nextPathPos = this.detailedPath[this.currentPathIndex + 1];

      // Convert maze indices to world coordinates
      const targetX = getNormalPos(
        nextPathPos.col,
        this.mazeLayout,
        this.gridSize,
        "x"
      );
      const targetY = getNormalPos(
        nextPathPos.row,
        this.mazeLayout,
        this.gridSize,
        "y"
      );

      // Calculate distance using world coordinates
      const dx = targetX - this.bot.position.x;
      const dy = targetY - this.bot.position.y;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = 5;

      if (distance < speed) {
        this.currentPathIndex++;
        this.updateProgressLine();
      } else {
        // Move towards target position
        this.bot.position.x += (dx / distance) * speed;
        this.bot.position.y += (dy / distance) * speed;
      }
    }

    update(deltaTime) {
      if (this.isWaiting) {
        if (
          Date.now() - this.waitStartTime >=
          this.config.checkpoints[this.checkpointIndex].time * 1000
        ) {
          this.isWaiting = false;
          this.checkpointIndex++;
        }
        return;
      }

      this.moveObject();
    }
  }
  let controller: MazeController;
  let camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer;
  let plane: THREE.Plane;
  let pointer,
    raycaster: THREE.Raycaster,
    isShiftDown = false;
  let clock: THREE.Clock;

  let rollOverMesh, rollOverMaterial;
  let cubeGeo, cubeMaterial;

  let assetManager: spine.AssetManager;
  let mesh, skeletonMesh: spine.SkeletonMesh;
  let lastFrameTime = Date.now() / 1000;
  let gridSize = 100;
  let timerText;
  const objects = [];

  onMount(() => {
    init();
  });

  function init() {
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, -150, 800);
    camera.lookAt(0, 0, 0);
    camera.rotation.x = 0.194; // Tilt up slightly

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    clock = new THREE.Clock();

    //! spine here
    assetManager = new spine.AssetManager("/spine/");
    assetManager.loadBinary("enemy_1111_ucommd_2.skel");
    assetManager.loadTextureAtlas("enemy_1111_ucommd_2.atlas");
    // roll-over helpers

    const rollOverGeo = new THREE.BoxGeometry(100, 100, 100);
    rollOverMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
    });
    rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    scene.add(rollOverMesh);

    // cubes

    const map = new THREE.TextureLoader().load("/square-outline-textured.png");
    map.colorSpace = THREE.SRGBColorSpace;
    cubeGeo = new THREE.BoxGeometry(100, 100, 100);
    cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xfeb74c, map: map });

    // grid

    const gridHelper = new THREE.GridHelper(1000, 20);
    // scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(200);
    axesHelper.position.x = 650;
    axesHelper.position.y = 0;
    axesHelper.position.z = 0;

    scene.add(axesHelper);

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    const geometry = new THREE.PlaneGeometry(
      mazeLayout[0].length * gridSize,
      mazeLayout.length * gridSize
    );
    // geometry.rotateX(-Math.PI / 2);

    plane = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    scene.add(plane);
    addWalls(mazeLayout);

    objects.push(plane);

    // lights

    const ambientLight = new THREE.AmbientLight(0x606060, 3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(1, 0.75, 0.5).normalize();
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      // alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerdown", onPointerDown);
    // document.addEventListener("keydown", onDocumentKeyDown);
    // document.addEventListener("keyup", onDocumentKeyUp);

    //

    window.addEventListener("resize", onWindowResize);
    load();
  }

  function load() {
    if (assetManager.isLoadingComplete()) {
      // Add a box to the scene to which we attach the skeleton mesh
      let spineMeshGeometry = new THREE.CircleGeometry(10, 32);
      let spineMeshMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        // wireframe: true,
        visible: true,
      });
      mesh = new THREE.Mesh(spineMeshGeometry, spineMeshMaterial);
      // setPosition(mesh, [19, 19]);
      // Initialize bot position
      setPosition(
        mesh,
        [movementConfig.startPosition.col, movementConfig.startPosition.row],
        mazeLayout,
        gridSize
      );
      controller = new MazeController(
        mazeLayout,
        movementConfig,
        mesh,
        gridSize
      );
      scene.add(mesh);
      objects.push(mesh);
      // Load the texture atlas using name.atlas and name.png from the AssetManager.
      // The function passed to TextureAtlas is used to resolve relative paths.
      const atlas = assetManager.get("enemy_1111_ucommd_2.atlas");
      // Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
      const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
      // Create a SkeletonJson instance for parsing the .json file.
      const skeletonBinary = new spine.SkeletonBinary(atlasLoader);

      // Set the scale to apply during parsing, parse the file, and create a new skeleton.
      skeletonBinary.scale = 0.4;
      const skeletonData = skeletonBinary.readSkeletonData(
        assetManager.get("enemy_1111_ucommd_2.skel")
      );

      // Create a SkeletonMesh from the data and attach it to the scene
      skeletonMesh = new spine.SkeletonMesh(skeletonData, (parameters) => {
        parameters.depthTest = false;
        parameters.alphaTest = 0.001;
      });
      mesh.add(skeletonMesh);
      skeletonMesh.state.setAnimation(0, "Idile", true);
      renderer.setAnimationLoop(render);
    } else requestAnimationFrame(load);
  }

  function addWalls(mazeLayout) {
    mazeLayout.toReversed().forEach((row, rowIdx) =>
      row.forEach((col, colIdx) => {
        if (col === 1) {
          const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
          const { posX, posY } = gameToPos([colIdx, rowIdx], mazeLayout, 100);
          voxel.position.set(posX, posY, 0);
          scene.add(voxel);

          objects.push(voxel);
        }
      })
    );
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
  }

  function onPointerMove(event) {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(objects, false);

    if (intersects.length > 0) {
      const intersect = intersects[0];

      rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
      rollOverMesh.position
        .divideScalar(100)
        .floor()
        .multiplyScalar(100)
        .addScalar(50);

      render();
    }
  }

  function onPointerDown(event) {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(objects, false);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      console.log(intersect.point);
      console.log(intersects)

      // render();
    }
  }

  
  function render() {
    const now = Date.now() / 1000;
    const delta = clock.getDelta();
    lastFrameTime = now;
    skeletonMesh.update(delta);
    controller.update(delta);
    renderer.render(scene, camera);
  }
</script>
