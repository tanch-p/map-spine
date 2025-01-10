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
      this.config = convertMovementConfig(movementConfig, mazeLayout);
      this.checkpointIndex = 0;
      this.currentPathIndex = 0;
      this.path = [];
      this.isWaiting = false;
      this.waitStartTime = 0;
      this.mazeHeight = mazeLayout.length;
      this.mazeWidth = mazeLayout[0].length;
      this.detailedPath = [];

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
        const pathSegment = this.findPathTheta(start, end);
        console.log(pathSegment);
        if (pathSegment) {
          this.detailedPath.push(
            ...(i === 0 ? pathSegment : pathSegment.slice(1))
          );
        }
      }
      console.log(this.detailedPath);
    }

    findPathTheta(start, end) {
      const openSet = new Set();
      const closedSet = new Set();
      const cameFrom = new Map();
      const gScore = new Map();
      const fScore = new Map();

      const startKey = `${start.row},${start.col}`;
      openSet.add(startKey);
      gScore.set(startKey, 0);
      fScore.set(startKey, this.heuristic(start, end));

      while (openSet.size > 0) {
        let current = null;
        let lowestFScore = Infinity;

        for (const key of openSet) {
          const score = fScore.get(key);
          if (score < lowestFScore) {
            lowestFScore = score;
            current = key;
          }
        }

        const [currentRow, currentCol] = current.split(",").map(Number);
        const currentPos = { row: currentRow, col: currentCol };

        if (currentRow === end.row && currentCol === end.col) {
          return this.reconstructPath(cameFrom, current);
        }

        openSet.delete(current);
        closedSet.add(current);

        // Get neighbors with any-angle pathfinding
        const neighbors = this.getNeighbors(currentRow, currentCol);

        for (const neighbor of neighbors) {
          const neighborKey = `${neighbor.row},${neighbor.col}`;

          if (closedSet.has(neighborKey)) continue;

          // Check line of sight from parent
          const parent = cameFrom.get(current);
          let parentPos = currentPos;

          if (parent) {
            const [parentRow, parentCol] = parent.split(",").map(Number);
            parentPos = { row: parentRow, col: parentCol };
          }

          // If we have line of sight to parent, use that path instead
          const useParentPath =
            parent && this.hasLineOfSight(parentPos, neighbor);
          const pathParent = useParentPath ? parent : current;
          const pathStartPos = useParentPath ? parentPos : currentPos;

          const tentativeGScore =
            gScore.get(pathParent) +
            this.getEuclideanDistance(pathStartPos, neighbor);

          if (!openSet.has(neighborKey)) {
            openSet.add(neighborKey);
          } else if (tentativeGScore >= gScore.get(neighborKey)) {
            continue;
          }

          cameFrom.set(neighborKey, pathParent);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(
            neighborKey,
            tentativeGScore + this.heuristic(neighbor, end)
          );
        }
      }

      return null;
    }

    hasLineOfSight(start, end) {
      // Bresenham's line algorithm with cell checking
      const points = this.getLinePoints(start, end);

      for (const point of points) {
        // Check if point is inside a wall
        if (
          this.mazeLayout[Math.floor(point.row)][Math.floor(point.col)] === 1
        ) {
          return false;
        }

        // Check diagonal wall cutting
        if (
          Math.floor(point.row) !== point.row ||
          Math.floor(point.col) !== point.col
        ) {
          const r1 = Math.floor(point.row);
          const r2 = Math.ceil(point.row);
          const c1 = Math.floor(point.col);
          const c2 = Math.ceil(point.col);

          if (this.mazeLayout[r1][c1] === 1 && this.mazeLayout[r2][c2] === 1) {
            return false;
          }
        }
      }

      return true;
    }

    getLinePoints(start, end) {
      const points = [];
      const steps =
        Math.max(Math.abs(end.row - start.row), Math.abs(end.col - start.col)) *
        2;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        points.push({
          row: start.row + (end.row - start.row) * t,
          col: start.col + (end.col - start.col) * t,
        });
      }

      return points;
    }

    getEuclideanDistance(a, b) {
      const dRow = a.row - b.row;
      const dCol = a.col - b.col;
      return Math.sqrt(dRow * dRow + dCol * dCol);
    }

    getNeighbors(row, col) {
      const neighbors = [];
      // Include more directions for smoother paths
      const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];

      for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (
          newRow < 0 ||
          newRow >= this.mazeHeight ||
          newCol < 0 ||
          newCol >= this.mazeWidth
        ) {
          continue;
        }

        if (this.mazeLayout[newRow][newCol] === 1) {
          continue;
        }

        neighbors.push({ row: newRow, col: newCol });
      }

      return neighbors;
    }
    heuristic(a, b) {
      if (this.config.allowDiagonalMove) {
        // Chebyshev distance for diagonal movement
        return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
      } else {
        // Manhattan distance for non-diagonal movement
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
      }
    }

    reconstructPath(cameFrom, current) {
      const path = [];
      let currentKey = current;

      while (cameFrom.has(currentKey)) {
        const [row, col] = currentKey.split(",").map(Number);
        path.unshift({ row, col });
        currentKey = cameFrom.get(currentKey);
      }

      const [row, col] = currentKey.split(",").map(Number);
      path.unshift({ row, col });
      return path;
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
        this.mazeLayout[0].length / 2,
        this.gridSize,
        "x"
      );
      const targetY = getNormalPos(
        nextPathPos.row,
        this.mazeLayout.length / 2,
        this.gridSize,
        "y"
      );

      // Calculate distance using world coordinates
      const dx = targetX - this.bot.position.x;
      const dy = targetY - this.bot.position.y;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = 1.5;

      if (distance < speed) {
        this.currentPathIndex++;
        // this.updateProgressLine();
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
    camera.position.set(0, 0, 800);
    camera.lookAt(0, 0, 0);
    // camera.rotation.x = 0.194; // Tilt up slightly

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
      new THREE.MeshBasicMaterial({ visible: true })
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
    // document.addEventListener("pointerdown", onPointerDown);
    // document.addEventListener("keydown", onDocumentKeyDown);
    // document.addEventListener("keyup", onDocumentKeyUp);

    //

    window.addEventListener("resize", onWindowResize);
    load();
  }

  function load() {
    if (assetManager.isLoadingComplete()) {
      // Add a box to the scene to which we attach the skeleton mesh
      let spineMeshGeometry = new THREE.CircleGeometry(25, 32);
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
        parameters.depthTest = true;
        parameters.depthWrite = true;
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
      // delete cube

      if (isShiftDown) {
        if (intersect.object !== plane) {
          scene.remove(intersect.object);

          objects.splice(objects.indexOf(intersect.object), 1);
        }

        // create cube
      } else {
        const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
        voxel.position.copy(intersect.point).add(intersect.face.normal);
        voxel.position
          .divideScalar(100)
          .floor()
          .multiplyScalar(100)
          .addScalar(50);
        scene.add(voxel);

        objects.push(voxel);
      }

      // render();
    }
  }

  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 16:
        isShiftDown = true;
        break;
    }
  }

  function onDocumentKeyUp(event) {
    switch (event.keyCode) {
      case 16:
        isShiftDown = false;
        break;
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
