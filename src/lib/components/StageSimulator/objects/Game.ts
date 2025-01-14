import * as THREE from "three";
import * as spine from "$lib/spine";
import { GameMap } from "./GameMap";
import { Enemy } from "./Enemy";
import { gameToPos, generateMaze } from "../functions/MazeHelpers";

export class Game {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock: THREE.Clock;
  renderer: THREE.WebGLRenderer;
  objects: THREE.Mesh[];
  cubeGeo: THREE.BoxGeometry;
  cubeMaterial: THREE.MeshLambertMaterial;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  map: GameMap;
  mazeLayout: [number[]];
  config;
  assetManager: spine.AssetManager;
  gridSize: number;
  enemies: Enemy[];

  constructor(config, enemies) {
    this.mazeLayout = generateMaze(config.map, config.tiles);
    this.config = config;
    this.gridSize = 50;
    this.objects = [];
    this.enemies = [];

    // threejs
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, -150, 800);
    this.camera.lookAt(0, 0, 0);
    this.camera.rotation.x = 0.194; // Tilt up slightly
    // lights

    const ambientLight = new THREE.AmbientLight(0x606060, 3);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(1, 0.75, 0.5).normalize();
    this.scene.add(directionalLight);
    this.clock = new THREE.Clock();

    const rollOverGeo = new THREE.BoxGeometry(100, 100, 100);
    const rollOverMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
    });
    const rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    this.scene.add(rollOverMesh);

    // cubes
    const map = new THREE.TextureLoader().load("/square-outline-textured.png");
    map.colorSpace = THREE.SRGBColorSpace;
    this.cubeGeo = new THREE.BoxGeometry(100, 100, 100);
    this.cubeMaterial = new THREE.MeshLambertMaterial({
      color: 0xfeb74c,
      map: map,
    });

    const geometry = new THREE.PlaneGeometry(
      this.mazeLayout[0].length * this.gridSize,
      this.mazeLayout.length * this.gridSize
    );
    const plane = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ visible: true })
    );
    this.scene.add(plane);
    this.objects.push(plane);
    this.addWalls(this.mazeLayout);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // spine here
    this.assetManager = new spine.AssetManager("/spine/");
    for (const enemy of enemies) {
      this.assetManager.loadBinary("enemy_1111_ucommd_2.skel");
      this.assetManager.loadTextureAtlas("enemy_1111_ucommd_2.atlas");
    }

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener("resize", this.onWindowResize);

    this.map = new GameMap(this.scene);
    this.load();
  }

  addWalls(mazeLayout: [number[]]) {
    mazeLayout.toReversed().forEach((row, rowIdx) =>
      row.forEach((mask, colIdx) => {
        if (mask === 1) {
          const voxel = new THREE.Mesh(this.cubeGeo, this.cubeMaterial);
          const { posX, posY } = gameToPos(
            [rowIdx, colIdx],
            mazeLayout,
            this.gridSize
          );
          voxel.position.set(posX, posY, 0);
          this.scene.add(voxel);

          this.objects.push(voxel);
        }
      })
    );
  }

  load() {
    if (this.assetManager.isLoadingComplete()) {
      // Add a box to the scene to which we attach the skeleton mesh
      let spineMeshGeometry = new THREE.CircleGeometry(25, 32);
      let spineMeshMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        // wireframe: true,
        visible: true,
      });
      for (const enemy of enemies) {
        const enemyObj = new Enemy();
        enemyObj.mesh = new THREE.Mesh(spineMeshGeometry, spineMeshMaterial);
        const atlas = this.assetManager.get("enemy_1111_ucommd_2.atlas");
        const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
        const skeletonBinary = new spine.SkeletonBinary(atlasLoader);
        skeletonBinary.scale = 0.4;
        const skeletonData = skeletonBinary.readSkeletonData(
          this.assetManager.get("enemy_1111_ucommd_2.skel")
        );

        const skeletonMesh = new spine.SkeletonMesh(
          skeletonData,
          (parameters) => {
            parameters.depthTest = false;
            parameters.alphaTest = 0.001;
          }
        );
        enemyObj.skel = skeletonMesh;
        enemyObj.mesh.add(skeletonMesh);
        enemyObj.skel.state.setAnimation(0, "Idile", true);
      }

      this.renderer.setAnimationLoop(this.render);
    } else requestAnimationFrame(this.load);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.render();
  }
  render() {
    const delta = this.clock.getDelta();
    this.map.update(delta);
    this.renderer.render(this.scene, this.camera);
  }
}
