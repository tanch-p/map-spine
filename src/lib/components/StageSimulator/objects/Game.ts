import * as THREE from "three";
import * as spine from "$lib/spine";
import { GameMap } from "./GameMap";
import SpawnManager from "./SpawnManager";
import { GameConfig } from "./GameConfig";
import { generateMaze } from "../functions/MazeHelpers";
import { Theta } from "./Theta";
import { SpineScaleManager } from "./SpineScaleManager";
import { GameManager } from "./GameManager";
import { FadingLine } from "./FadingLine";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

export class Game {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pointer: THREE.Vector2;
  objects;
  raycaster: THREE.Raycaster;
  clock: THREE.Clock;
  renderer: THREE.WebGLRenderer;
  map: GameMap;
  spawnManager: SpawnManager;
  config;
  spineAssetManager: spine.AssetManager;
  enemies: any[];
  gameTime: number;
  gameManager: GameManager;
  public scaledElapsedTime: number = 0; // Total game-time elapsed

  constructor(config, canvasElement: HTMLCanvasElement) {
    this.config = config;
    this.enemies = config.enemies;
    this.objects = [];
    this.gameManager = GameManager.getInstance();

    const mazeLayout = generateMaze(config.mapData.map, config.mapData.tiles);
    GameConfig.mazeLayout = mazeLayout;
    GameConfig.pathFinder = new Theta(mazeLayout);

    // threejs
    const frustumSize = 1000;
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2, // left
      (frustumSize * aspect) / 2, // right
      frustumSize / 2, // top
      frustumSize / -2, // bottom
      1, // near
      1500 // far
    );
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.gameManager.scene = this.scene;
    // this.camera = new THREE.PerspectiveCamera(
    //   75,
    //   window.innerWidth / window.innerHeight,
    //   0.1,
    //   1000
    // );
    this.camera.position.set(0, -300, 850);
    this.camera.lookAt(0, 0, 0);
    this.camera.rotation.x = 0.4; // Tilt up slightly

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    // lights

    const ambientLight = new THREE.AmbientLight(0xcccccc, 3);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(-1, 1, 1).normalize();
    this.scene.add(directionalLight);
    this.clock = new THREE.Clock();

    const axesHelper = new THREE.AxesHelper(200);
    axesHelper.position.x = 650;
    axesHelper.position.y = 0;
    axesHelper.position.z = 0;

    this.scene.add(axesHelper);

    // time
    this.gameStartTime = performance.now(); // Track the start time of the game
    this.gameTime = 0;

    // spine here
    this.spineAssetManager = new spine.AssetManager("/spine/");
    for (const enemy of this.enemies) {
      this.spineAssetManager.loadBinary("enemy_1111_ucommd_2.skel");
      this.spineAssetManager.loadTextureAtlas("enemy_1111_ucommd_2.atlas");
    }
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", () => this.onWindowResize());
    document.addEventListener("pointerdown", (e) => this.onPointerDown(e));

    this.spineScaleManager = new SpineScaleManager(this.camera);
    this.map = new GameMap(
      this.scene,
      config,
      this.objects,
      this.spineAssetManager,
      this.spineScaleManager
    );
    this.spawnManager = new SpawnManager(config, this.map);
    this.t = 0;
    this.fadingLine = new FadingLine(this.scene);

    const loader = new FontLoader();
    new Promise((resolve) => {
      loader.load("/fonts/helvetiker_regular.typeface.json", (font) => {
        resolve(font);
      });
    }).then((font) => (GameConfig.font = font));
    this.load();
  }

  async load() {
    if (this.spineAssetManager.isLoadingComplete()) {
      this.renderer.setAnimationLoop(() => this.render());
    } else requestAnimationFrame(() => this.load());
  }

  reset() {}

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.render();
  }
  onPointerDown(event) {
    // console.log(this.objects);
    this.pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const intersects = this.raycaster.intersectObjects(this.objects, false);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      // console.log(intersect.point);
      if (intersect?.object?.userData?.enemy) {
        const enemy = intersect?.object?.userData?.enemy;
        if (enemy.selected) {
          enemy.hidePath();
        } else {
          enemy.showPath();
        }
        enemy.selected = !enemy.selected;
      }
      // render();
    }
  }
  render() {
    const deltaTime = this.clock.getDelta() * GameConfig.speedFactor;
    this.scaledElapsedTime += deltaTime;
    // this.spineScaleManager.updateAll();
    this.spawnManager.update(deltaTime, this.scaledElapsedTime);
    this.map.update(deltaTime);
    this.renderer.render(this.scene, this.camera);

    // this.fadingLine.addPoint(x, y, z);
  }

  cleanup() {}
}
