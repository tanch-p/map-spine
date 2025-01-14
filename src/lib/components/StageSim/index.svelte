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
        const pathSegment = this.findPathTheta(start, end);
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

        // Get neighbors including intermediate points
        const neighbors = this.getExpandedNeighbors(
          currentRow,
          currentCol,
          end
        );

        for (const neighbor of neighbors) {
          const neighborKey = `${neighbor.row},${neighbor.col}`;

          if (closedSet.has(neighborKey)) continue;

          const parent = cameFrom.get(current);
          let parentPos = currentPos;

          if (parent) {
            const [parentRow, parentCol] = parent.split(",").map(Number);
            parentPos = { row: parentRow, col: parentCol };
          }

          // Prefer straight-line movements when possible
          const isVerticalMove = neighbor.col === currentPos.col;
          const isHorizontalMove = neighbor.row === currentPos.row;
          const movementPenalty = isVerticalMove || isHorizontalMove ? 0.8 : 1;

          const useParentPath =
            parent && this.hasLineOfSight(parentPos, neighbor);
          const pathParent = useParentPath ? parent : current;
          const pathStartPos = useParentPath ? parentPos : currentPos;

          const tentativeGScore =
            gScore.get(pathParent) +
            this.getEuclideanDistance(pathStartPos, neighbor) * movementPenalty;

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
      const points = this.getLinePoints(start, end);
      // Check each point along the line
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];

        // Check current point
        if (
          this.mazeLayout[Math.round(current.row + 0.2)][
            Math.round(current.col + 0.2)
          ] === 1
        ) {
          return false;
        }

        // Check for diagonal wall cutting between current and next point
        const minRow = Math.min(
          Math.round(current.row + 0.2),
          Math.round(next.row + 0.2)
        );
        const maxRow = Math.max(
          Math.round(current.row + 0.2),
          Math.round(next.row + 0.2)
        );
        const minCol = Math.min(
          Math.round(current.col + 0.2),
          Math.round(next.col + 0.2)
        );
        const maxCol = Math.max(
          Math.round(current.col + 0.2),
          Math.round(next.col + 0.2)
        );

        // If moving diagonally, check both adjacent cells
        if (minRow !== maxRow && minCol !== maxCol) {
          if (
            this.mazeLayout[minRow][maxCol] === 1 ||
            this.mazeLayout[maxRow][minCol] === 1
          ) {
            return false;
          }
        }
      }

      // Check final point
      const lastPoint = points[points.length - 1];
      return (
        this.mazeLayout[Math.floor(lastPoint.row)][
          Math.floor(lastPoint.col)
        ] !== 1
      );
    }

    getLinePoints(start, end) {
      const points = [];
      // Increase the number of points checked along the line
      const steps =
        Math.max(Math.abs(end.row - start.row), Math.abs(end.col - start.col)) *
        4; // Increased from 2 to 4 for more precise checking

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        points.push({
          row: start.row + (end.row - start.row) * t,
          col: start.col + (end.col - start.col) * t,
        });
      }

      return points;
    }
    getExpandedNeighbors(row, col, end) {
      const neighbors = this.getNeighbors(row, col);

      // Add intermediate points for better path options
      const verticalDiff = end.row - row;
      const horizontalDiff = end.col - col;

      // If we're at the right height for a horizontal move to the end
      if (Math.abs(verticalDiff) <= 1) {
        const intermediateCol = Math.floor((col + end.col) / 2);
        if (this.isValidPosition(row, intermediateCol)) {
          neighbors.push({ row, col: intermediateCol });
        }
      }

      // If we're at the right column for a vertical move to the end
      if (Math.abs(horizontalDiff) <= 1) {
        const intermediateRow = Math.floor((row + end.row) / 2);
        if (this.isValidPosition(intermediateRow, col)) {
          neighbors.push({ row: intermediateRow, col });
        }
      }

      return neighbors;
    }

    getNeighbors(row, col) {
      const neighbors = [];
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

        // Additional check for diagonal movement
        if (Math.abs(dRow) === 1 && Math.abs(dCol) === 1) {
          // Check both adjacent cells when moving diagonally
          if (
            this.mazeLayout[row][newCol] === 1 ||
            this.mazeLayout[newRow][col] === 1
          ) {
            continue;
          }
        }

        neighbors.push({ row: newRow, col: newCol });
      }

      return neighbors;
    }

    getEuclideanDistance(a, b) {
      const dRow = a.row - b.row;
      const dCol = a.col - b.col;
      return Math.sqrt(dRow * dRow + dCol * dCol);
    }
    isValidPosition(row, col) {
      return (
        row >= 0 &&
        row < this.mazeHeight &&
        col >= 0 &&
        col < this.mazeWidth &&
        this.mazeLayout[row][col] !== 1
      );
    }

    heuristic(a, b) {
      // Modified heuristic to prefer straight-line movements
      const dRow = Math.abs(a.row - b.row);
      const dCol = Math.abs(a.col - b.col);
      const straight = Math.abs(dRow - dCol);
      const diagonal = Math.min(dRow, dCol);
      return straight + diagonal * 1.1; // Slight penalty for diagonal movement
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
