<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";

  let lastFrameTime = Date.now() / 1000;

  class MazeController {
    constructor(mazeLayout, movementConfig, bot, cellSize = 1) {
      this.mazeLayout = mazeLayout;
      this.config = movementConfig;
      this.currentPosition = { ...movementConfig.startPosition };
      this.checkpointIndex = 0;
      this.pathToFollow = [];
      this.isWaiting = false;
      this.waitStartTime = 0;

      // Three.js specific properties
      this.bot = bot;
      this.cellSize = cellSize;
      this.moveSpeed = 2.0; // units per second
      this.rotationSpeed = Math.PI * 2; // radians per second
      this.targetRotation = 0;
      this.isRotating = false;
      this.movementProgress = 0;
      this.startPos = new THREE.Vector3();
      this.targetPos = new THREE.Vector3();

      // Initialize bot position
      this.updateBotPosition(
        this.currentPosition.col * cellSize,
        0,
        this.currentPosition.row * cellSize
      );
    }

    updateBotPosition(x, y, z) {
      this.bot.position.set(x, y, z);
    }

    // Calculate direction angle between current and next position
    calculateTargetRotation(current, next) {
      const dx = next.col - current.col;
      const dz = next.row - current.row;
      return Math.atan2(dx, dz);
    }

    // Interpolate rotation
    updateRotation(deltaTime) {
      const currentRotation = this.bot.rotation.y;
      const rotationDiff = this.targetRotation - currentRotation;

      // Normalize the rotation difference to [-PI, PI]
      let shortestRotation =
        ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI;

      if (Math.abs(shortestRotation) > 0.01) {
        const step =
          Math.sign(shortestRotation) * this.rotationSpeed * deltaTime;
        if (Math.abs(step) > Math.abs(shortestRotation)) {
          this.bot.rotation.y = this.targetRotation;
          this.isRotating = false;
        } else {
          this.bot.rotation.y += step;
        }
        return true;
      }

      this.isRotating = false;
      return false;
    }

    // Interpolate position
    updatePosition(deltaTime) {
      if (this.movementProgress < 1) {
        this.movementProgress += this.moveSpeed * deltaTime;
        if (this.movementProgress > 1) this.movementProgress = 1;

        const newX = THREE.MathUtils.lerp(
          this.startPos.x,
          this.targetPos.x,
          this.movementProgress
        );
        const newZ = THREE.MathUtils.lerp(
          this.startPos.z,
          this.targetPos.z,
          this.movementProgress
        );
        this.updateBotPosition(newX, 0, newZ);

        return true;
      }
      return false;
    }

    // Calculate distance between two points (including diagonal)
    calculateDistance(pos1, pos2) {
      return this.config.allowDiagonalMove
        ? Math.max(Math.abs(pos1.row - pos2.row), Math.abs(pos1.col - pos2.col))
        : Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
    }

    // Get valid neighbors for a position
    getNeighbors(position) {
      const neighbors = [];
      const directions = this.config.allowDiagonalMove
        ? [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
          ]
        : [
            [-1, 0],
            [0, -1],
            [0, 1],
            [1, 0],
          ];

      for (const [dRow, dCol] of directions) {
        const newRow = position.row + dRow;
        const newCol = position.col + dCol;

        if (
          newRow >= 0 &&
          newRow < this.mazeLayout.length &&
          newCol >= 0 &&
          newCol < this.mazeLayout[0].length &&
          this.mazeLayout[newRow][newCol] !== 1
        ) {
          neighbors.push({ row: newRow, col: newCol });
        }
      }
      return neighbors;
    }

    // A* pathfinding implementation
    findPath(start, end) {
      const openSet = [start];
      const cameFrom = new Map();
      const gScore = new Map();
      const fScore = new Map();

      const posToString = (pos) => `${pos.row},${pos.col}`;
      gScore.set(posToString(start), 0);
      fScore.set(posToString(start), this.calculateDistance(start, end));

      while (openSet.length > 0) {
        let current = openSet.reduce((a, b) =>
          fScore.get(posToString(a)) < fScore.get(posToString(b)) ? a : b
        );

        if (current.row === end.row && current.col === end.col) {
          const path = [];
          while (current) {
            path.unshift(current);
            current = cameFrom.get(posToString(current));
          }
          return path;
        }

        openSet.splice(openSet.indexOf(current), 1);

        for (const neighbor of this.getNeighbors(current)) {
          const tentativeGScore = gScore.get(posToString(current)) + 1;
          const neighborString = posToString(neighbor);

          if (
            !gScore.has(neighborString) ||
            tentativeGScore < gScore.get(neighborString)
          ) {
            cameFrom.set(neighborString, current);
            gScore.set(neighborString, tentativeGScore);
            fScore.set(
              neighborString,
              tentativeGScore + this.calculateDistance(neighbor, end)
            );

            if (!openSet.find((pos) => posToString(pos) === neighborString)) {
              openSet.push(neighbor);
            }
          }
        }
      }
      return null;
    }

    async executeCheckpoint(checkpoint) {
      if (checkpoint.type === "WAIT_FOR_SECONDS") {
        this.isWaiting = true;
        this.waitStartTime = Date.now();
        await new Promise((resolve) =>
          setTimeout(resolve, checkpoint.time * 1000)
        );
        this.isWaiting = false;
        return true;
      } else if (checkpoint.type === "MOVE") {
        this.pathToFollow = this.findPath(
          this.currentPosition,
          checkpoint.position
        );
        return false;
      }
      return true;
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

      // Handle rotation and movement
      if (this.isRotating) {
        this.updateRotation(deltaTime);
        return;
      }

      if (this.movementProgress < 1) {
        this.updatePosition(deltaTime);
        return;
      }

      // Get next movement
      if (this.pathToFollow.length === 0) {
        if (this.checkpointIndex >= this.config.checkpoints.length) {
          if (!this.pathToExit) {
            this.pathToExit = this.findPath(
              this.currentPosition,
              this.config.endPosition
            );
            this.pathToFollow = this.pathToExit;
          }
        } else {
          this.executeCheckpoint(this.config.checkpoints[this.checkpointIndex]);
        }
        return;
      }

      // Start next movement
      if (this.pathToFollow.length > 0 && this.movementProgress >= 1) {
        const nextPosition = this.pathToFollow[0];

        // Set up next movement
        this.startPos.set(
          this.currentPosition.col * this.cellSize,
          0,
          this.currentPosition.row * this.cellSize
        );
        this.targetPos.set(
          nextPosition.col * this.cellSize,
          0,
          nextPosition.row * this.cellSize
        );

        // Calculate and set target rotation
        this.targetRotation = this.calculateTargetRotation(
          this.currentPosition,
          nextPosition
        );
        this.isRotating = true;
        this.movementProgress = 0;

        this.currentPosition = nextPosition;
        this.pathToFollow.shift();

        if (this.pathToFollow.length === 0 && !this.isWaiting) {
          this.checkpointIndex++;
        }
      }
    }

    getCurrentPosition() {
      return this.currentPosition;
    }

    isComplete() {
      return (
        this.checkpointIndex >= this.config.checkpoints.length &&
        this.pathToFollow.length === 0 &&
        this.currentPosition.row === this.config.endPosition.row &&
        this.currentPosition.col === this.config.endPosition.col &&
        this.movementProgress >= 1
      );
    }
    moveBot() {
      if (
        this.currentPath.length === 0 ||
        this.targetIndex >= this.currentPath.length
      ) {
        this.bot.position.set(0, 0.5, -6);
        return;
      }

      const target = this.currentPath[this.targetIndex];
      const dx = target.x - this.bot.position.x;
      const dz = target.z - this.bot.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 0.1) {
        this.targetIndex++;
        return;
      }

      // Smooth movement
      const speed = this.moveSpeed;
      this.bot.position.x += (dx / distance) * speed;
      this.bot.position.z += (dz / distance) * speed;

      // Smooth rotation
      const targetAngle = Math.atan2(dx, dz);
      let currentAngle = this.bot.rotation.y;

      // Normalize angle difference
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      // Apply smooth rotation
      this.bot.rotation.y += angleDiff * 0.1;
    }
  }

  class MazeGame {
    constructor() {
      // Scene setup
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setClearColor(0x87ceeb);
      document.body.appendChild(this.renderer.domElement);
      this.clock = new THREE.Clock();

      // Lighting
      const light = new THREE.PointLight(0xffffff, 1, 100);
      light.position.set(0, 10, 0);
      this.scene.add(light);
      this.scene.add(new THREE.AmbientLight(0xffffff));

      // Initialize maze and bot
      this.createMaze();
      this.createBot();

      // Camera positioning
      this.camera.position.y = 15;
      this.camera.position.z = 0;
      this.camera.lookAt(0, 0, 0);

      this.controller = new MazeController(
        this.mazeLayout,
        movementConfig,
        this.bot
      );

      // Start game loop
      this.animate();
    }

    createMaze() {
      this.mazeLayout = [
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 0, 1, 1, 3, 1],
        [0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
        [0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
        [2, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      ];

      const wallGeometry = new THREE.BoxGeometry(2, 2, 2);
      const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });

      for (let i = 0; i < this.mazeLayout.length; i++) {
        for (let j = 0; j < this.mazeLayout[i].length; j++) {
          if (this.mazeLayout[i][j] === 1) {
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(j * 2 - 6, 1, i * 2 - 6);
            this.scene.add(wall);
          }
        }
      }

      const floorGeometry = new THREE.PlaneGeometry(14, 14);
      const floorMaterial = new THREE.MeshPhongMaterial({
        color: 0x66aa66,
        side: THREE.DoubleSide,
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = Math.PI / 2;
      this.scene.add(floor);
    }

    createBot() {
      // Create bot with distinctive appearance
      const botGeometry = new THREE.ConeGeometry(0.5, 1, 4);
      const botMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
      this.bot = new THREE.Mesh(botGeometry, botMaterial);
      this.bot.rotation.x = Math.PI; // Make cone point forward
      this.scene.add(this.bot);
    }

    // In your animation loop
    animate = () => {
      requestAnimationFrame(this.animate);
      const now = Date.now() / 1000;
      const delta = this.clock.getDelta();
      lastFrameTime = now;
      this.controller.update(delta);
      this.renderer.render(this.scene, this.camera);
    };
  }

  onMount(() => {
    const game = new MazeGame();
  });

  const movementConfig = {
    motionMode: "WALK",
    startPosition: {
      row: 5,
      col: 0,
    },
    endPosition: {
      row: 2,
      col: 8,
    },
    checkpoints: [
      {
        type: "WAIT_FOR_SECONDS",
        time: 1.0,
      },
      {
        type: "MOVE",
        position: {
          row: 3,
          col: 0,
        },
      },
      {
        type: "MOVE",
        position: {
          row: 3,
          col: 3,
        },
      },
    ],
    allowDiagonalMove: true,
  };
</script>
