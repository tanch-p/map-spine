import * as THREE from "three";
import * as spine from "$lib/spine";
import { GameConfig } from "./GameConfig";
import { getVectorCoordinates as getVectorCoordinates } from "$lib/functions/lib";
import { GameManager } from "./GameManager";
import { TextSprite } from "./TextSprite";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export class Enemy {
  private countdownTexture: THREE.CanvasTexture;
  private countdownCanvas: HTMLCanvasElement;
  actions: any[];
  hp: number;
  speed: number;
  currentActionIndex: number = 0;
  mesh: THREE.Mesh;
  state: string;
  skel: spine.SkeletonMesh;
  alive: boolean = true;
  direction = 1;
  motionMode: "WALK" | "FLY";
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  isMoving: boolean = false;
  waitElapsedTime: number = 0;
  entry: boolean = true;
  entryElapsedTime: number = 0;
  exit: boolean = false;
  exitElapsedTime: number = 0;
  gameManager: GameManager;
  pathGroup;

  constructor(data, route, mesh, skeletonMesh) {
    this.timerText = null;
    this.route = route;
    this.motionMode = route.motionMode;
    this.actions = this.getActions(route);
    this.mesh = mesh;
    this.skel = skeletonMesh;
    this.hp = data.stats.hp;
    this.speed = data.stats.speed;
    this.state = "Idile";
    this.skel.state.setAnimation(0, "Idile", true);
    this.skel.skeleton.color.r = 0.2;
    this.skel.skeleton.color.g = 0.2;
    this.skel.skeleton.color.b = 0.2;
    this.gameManager = GameManager.getInstance();
    this.pathGroup = this.visualisePath(
      this.actions,
      this.currentActionIndex,
      this.route.startPosition
    );
    this.waitTimer = this.createCountdownSprite();
    const { x, y } = getVectorCoordinates(route.startPosition);
    this.mesh.position.set(x, y, GameConfig.baseZIndex);
    this.currentPos = new THREE.Vector3(x, y, GameConfig.baseZIndex);
  }

  getActions(route) {
    if (this.motionMode === "FLY") {
      return [
        ...route.checkpoints.map((cp) => {
          return { ...cp, pathType: "cp" };
        }),
        {
          type: "MOVE",
          time: 0.0,
          position: route.endPosition,
          reachOffset: {
            x: 0.0,
            y: 0.0,
          },
          randomizeReachOffset: false,
          reachDistance: 0.0,
          pathType: "end",
        },
      ];
    }

    // WALK
    let endCalcStartPos = route.startPosition;
    for (const checkpoint of route.checkpoints) {
      if (["MOVE", "APPEAR_AT_POS"].includes(checkpoint.type)) {
        endCalcStartPos = checkpoint.position;
      }
    }

    const endPaths = GameConfig.pathFinder.findPath(
      endCalcStartPos,
      route.endPosition
    );

    return [
      ...route.checkpoints.map((cp) => {
        return { ...cp, pathType: "cp" };
      }),
      ...endPaths.slice(1).map(({ row, col }) => {
        return {
          type: "MOVE",
          time: 0.0,
          position: { row, col },
          reachOffset: {
            x: 0.0,
            y: 0.0,
          },
          randomizeReachOffset: false,
          reachDistance: 0.0,
          pathType: "end",
        };
      }),
    ];
  }

  entryColorChange(delta) {
    if (this.entryElapsedTime > 0.5) {
      this.entry = false;
      this.skel.skeleton.color.r = 1;
      this.skel.skeleton.color.g = 1;
      this.skel.skeleton.color.b = 1;
      return;
    }
    this.entryElapsedTime += delta * 2;
    this.skel.skeleton.color.r += delta * 2;
    this.skel.skeleton.color.g += delta * 2;
    this.skel.skeleton.color.b += delta * 2;
  }

  exitColorChange(delta) {
    if (this.exitElapsedTime > 0.5) {
      this.exit = false;
      this.mesh.visible = false;
      this.alive = false;
      return;
    }
    this.exitElapsedTime += delta * 2;
    this.skel.skeleton.color.r -= delta * 2;
    this.skel.skeleton.color.g -= delta * 2;
    this.skel.skeleton.color.b -= delta * 2;
    this.skel.skeleton.color.a -= delta * 2;
  }

  update(delta: number) {
    this.skel.update(delta);
    if (this.entry) {
      this.entryColorChange(delta);
    }
    if (this.exit) {
      this.exitColorChange(delta);
    }
    if (this.currentActionIndex >= this.actions.length) {
      this.onEnd();
      return;
    }
    const { type, position, pathType, time, reachOffset } =
      this.actions[this.currentActionIndex];

    if (this.selected) {
      if (!this.pathOn) {
        this.visualisePath(
          this.actions,
          this.currentActionIndex,
          this.route.startPosition
        );
        this.pathOn = true;
      }
    }

    switch (type) {
      case "MOVE":
        if (!this.isMoving) {
          // Start new movement
          const { x, y } = getVectorCoordinates(position, reachOffset);
          this.targetPos = new THREE.Vector3(x, y, GameConfig.baseZIndex);
          this.isMoving = true;
          this.state = "Move";
          this.skel.state.setAnimation(0, "Move", true);
        }
        const direction = new THREE.Vector3()
          .subVectors(this.targetPos, this.mesh.position)
          .normalize();
        if (direction.x !== 0) {
          this.direction = direction.x;
          this.skel.scale.x = direction.x < 0 ? -1 : 1;
        }
        const distance = this.mesh.position.distanceTo(this.targetPos);
        const adjustedSpeed = this.speed * delta * GameConfig.gridSize;
        if (distance > adjustedSpeed) {
          // speed = 1 means 1 tile/s
          const dx = this.targetPos.x - this.mesh.position.x;
          const dy = this.targetPos.y - this.mesh.position.y;
          this.mesh.position.x += (dx / distance) * adjustedSpeed;
          this.mesh.position.y += (dy / distance) * adjustedSpeed;
        } else {
          // Movement complete
          this.mesh.position.copy(this.targetPos);
          this.isMoving = false;
          this.currentActionIndex++;
        }

        break;

      case "WAIT_FOR_SECONDS":
        if (this.waitElapsedTime === 0) {
          this.mesh.add(this.waitTimer);
          this.state = "Idile";
          this.skel.state.setAnimation(0, "Idile", true);
          this.waitElapsedTime += delta;
        } else {
          this.updateCountdownSprite(
            this.waitTimer,
            time - this.waitElapsedTime
          );
          this.waitElapsedTime += delta;
        }

        if (this.waitElapsedTime >= time) {
          this.mesh.remove(this.waitTimer);
          this.waitElapsedTime = 0;
          this.currentActionIndex++;
        }
        break;

      case "DISAPPEAR":
        this.mesh.visible = false;
        this.currentActionIndex++;
        break;

      case "APPEAR_AT_POS":
        this.mesh.visible = true;
        const { x, y } = getVectorCoordinates(position, reachOffset);
        this.mesh.position.set(x, y, GameConfig.baseZIndex);
        this.currentPos = new THREE.Vector3(x, y, GameConfig.baseZIndex);
        this.currentActionIndex++;
        break;
      default:
        console.log(type);
    }
  }

  takeDamage(damage: number): void {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.onDeath();
    }
  }
  onEnd(): void {
    this.skel.state.setAnimation(0, "Default", false);
    this.exit = true;
  }

  onDeath(): void {
    this.skel.state.setAnimation(0, "Die", false);
    this.exit = true;
  }

  showPath() {
    this.gameManager.scene.add(this.pathGroup);
  }
  hidePath() {
    this.gameManager.scene.remove(this.pathGroup);
  }

  visualisePath(paths, currentActionIndex, startPos) {
    const remainingPaths = paths.filter((ele, i) => i >= currentActionIndex);
    const returnGroup = new THREE.Group();
    const lineGroup = new THREE.Group();
    const movePaths = paths.filter(
      (ele) => ele.type === "MOVE" || ele.type === "APPEAR_AT_POS"
    );
    for (let i = 0; i < movePaths.length; i++) {
      const startCoordinates = movePaths?.[i - 1]?.position || startPos;
      const startOffSet = i - 1 === -1 ? null : movePaths?.[i - 1].reachOffset;
      const endCoordinates = movePaths[i].position;
      const endOffset = movePaths?.[i].reachOffset;

      const startPoint = getVectorCoordinates(startCoordinates, startOffSet);
      const start = new THREE.Vector3(startPoint.x, startPoint.y, 0);
      // Define start and end points
      const endPoint = getVectorCoordinates(endCoordinates, endOffset);
      const end = new THREE.Vector3(endPoint.x, endPoint.y, 0);

      // Create a geometry and add the points
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

      // Create a material for the line
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red line

      // Create the line
      const line = new THREE.Line(geometry, material);
      line.position.z = 10;
      lineGroup.add(line);
    }
    for (let i = 0; i < paths.length; i++) {
      const { type, pathType, time, position, reachOffset } = paths[i];
      const group = new THREE.Group();

      switch (type) {
        case "MOVE":
          if (pathType === "cp") {
            const texture = GameConfig.sprites.get("flag").texture;

            const geometry = new THREE.CircleGeometry(
              GameConfig.gridSize / 3,
              32
            );
            const material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
            });
            const circle = new THREE.Mesh(geometry, material);
            const { x, y } = getVectorCoordinates(position, reachOffset);
            circle.position.set(x, y, GameConfig.baseZIndex + 10);
            group.add(circle);
          }
          break;
        case "WAIT_FOR_SECONDS":
          const geometry = new THREE.CircleGeometry(
            GameConfig.gridSize / 5,
            32
          );
          const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const circle = new THREE.Mesh(geometry, material);
          const waitPosition = i === 0 ? startPos : paths[i - 1].position;
          const { x, y } = getVectorCoordinates(waitPosition, reachOffset);
          circle.renderOrder = 1;
          const text = new TextSprite(time).get();
          group.add(text);
          group.add(circle);
          group.position.set(x, y, GameConfig.baseZIndex + 15);
          break;
        default:
          break;
      }
      returnGroup.add(group);
    }
    returnGroup.add(lineGroup);
    return returnGroup;
  }
  createCountdownSprite = (text: string = "",): THREE.Sprite => {
    const group = new THREE.Group();
    const circleGeometry = new THREE.CircleGeometry(32, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xd1d1d1 });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    const ringColor = parseInt(text) <= 10 ? 0xdc143c : 0xF08080
    const ringGeometry = new THREE.RingGeometry(30, 32, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: ringColor });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.z = 2;
    const textGeometry = new TextGeometry(text, {
      font: GameConfig.font,
      size: 20,
      depth: 1,
      curveSegments: 12,
      bevelEnabled: false,
    });
    textGeometry.computeBoundingBox();
    const centerOffset =
      -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
    const yOffset =
      -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(textGeometry, textMaterial);
    mesh.position.x = centerOffset;
    mesh.position.y = yOffset;
    group.position.set(
      0,
      this.skel.skeleton.data.height * 0.4 + GameConfig.gridSize / 5,
      0
    );
    group.add(ring, circle, mesh);
    return group;
  };

  updateCountdownSprite(mesh, timer: number) {
    this.mesh.remove(mesh);
    const newMesh = this.createCountdownSprite(timer.toFixed());
    this.mesh.add(newMesh);
    this.waitTimer = newMesh;
  }
}
