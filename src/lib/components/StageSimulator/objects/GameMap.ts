import * as THREE from "three";
import * as spine from "$lib/spine";
import { Enemy } from "./Enemy";
import { convertMovementConfig, gameToPos } from "$lib/functions/lib";
import { Theta } from "./Theta";
import { GameConfig } from "./GameConfig";

export class GameMap {
  scene: THREE.Scene;
  enemies: Enemy[] = [];
  cubeGeo: THREE.BoxGeometry;
  cubeMaterial: THREE.MeshLambertMaterial;
  objects: THREE.Mesh[];
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  gameTime: number;
  cost: number;
  spineAssetManager: spine.AssetManager;
  textureLoader: THREE.TextureLoader;
  tileTexture;
  pathFinder: Theta;
  sprites: any;
  constructor(scene: THREE.Scene, config, spineAssetManager) {
    this.config = config;
    this.scene = scene;
    this.objects = [];
    this.spineAssetManager = spineAssetManager;
    this.pathFinder = new Theta(GameConfig.mazeLayout);
    this.sprites = [];
    this.textureLoader = new THREE.TextureLoader();
    const shadow = this.textureLoader.load("sprite_shadow.png");
    this.sprites.shadow = shadow;

    this.tileTexture = this.textureLoader.load("floor_icons.png");
    this.tileTexture.magFilter = THREE.NearestFilter; // Keeps pixel art sharp
    this.tileTexture.minFilter = THREE.NearestFilter;

    // const tile = this.createTile(2, 0, 0);
    // red cube which appears on mouse hover
    // const rollOverGeo = new THREE.BoxGeometry(100, 100, 100);
    // const rollOverMaterial = new THREE.MeshBasicMaterial({
    //   color: 0xff0000,
    //   opacity: 0.5,
    //   transparent: true,
    // });
    // const rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    // this.scene.add(rollOverMesh);

    // cubes
    const map = new THREE.TextureLoader().load("/square-outline-textured.png");
    map.colorSpace = THREE.SRGBColorSpace;
    this.cubeGeo = new THREE.BoxGeometry(100, 100, 100);
    this.cubeMaterial = new THREE.MeshLambertMaterial({
      color: 0xfeb74c,
      map: map,
    });
    this.addWalls(GameConfig.mazeLayout);

    const geometry = new THREE.PlaneGeometry(
      GameConfig.mazeLayout[0].length * GameConfig.gridSize,
      GameConfig.mazeLayout.length * GameConfig.gridSize
    );
    const plane = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.scene.add(plane);
    this.objects.push(plane);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
  }

  createTile(tileIndex: number, positionX: number, positionY: number) {
    const tilesHoriz = 4;
    const tilesVert = 4;
    const geometry = new THREE.PlaneGeometry(
      GameConfig.gridSize,
      GameConfig.gridSize
    );
    const material = new THREE.MeshBasicMaterial({ map: this.tileTexture });
    const tile = new THREE.Mesh(geometry, material);

    // Calculate UV mapping for the correct tile
    const tileUVWidth = 1 / tilesHoriz;
    const tileUVHeight = 1 / tilesVert;

    const uvOffsetX = 2 * tileUVWidth;
    const uvOffsetY = 1 - (0 + 1) * tileUVHeight; // Flip Y because texture coordinates start from bottom

    // Modify UV coordinates to match the specific tile in the sprite sheet
    const uvs = geometry.attributes.uv;
    const uvArray = uvs.array;

    // Set UV coordinates for each vertex
    // Bottom left
    uvArray[0] = uvOffsetX;
    uvArray[1] = uvOffsetY;
    // Bottom right
    uvArray[2] = uvOffsetX + tileUVWidth;
    uvArray[3] = uvOffsetY;
    // Top left
    uvArray[4] = uvOffsetX;
    uvArray[5] = uvOffsetY + tileUVHeight;
    // Top right
    uvArray[6] = uvOffsetX + tileUVWidth;
    uvArray[7] = uvOffsetY + tileUVHeight;

    tile.rotateZ(-Math.PI / 2);
    tile.position.set(0, 0, 0);
    this.scene.add(tile);

    return tile;
  }

  addWalls(mazeLayout: [number[]]) {
    mazeLayout.toReversed().forEach((row, rowIdx) =>
      row.forEach((mask, colIdx) => {
        if (mask === 1) {
          const voxel = new THREE.Mesh(this.cubeGeo, this.cubeMaterial);
          const { posX, posY } = gameToPos([colIdx, rowIdx]);
          voxel.position.set(posX, posY, 0);
          this.scene.add(voxel);
        }
      })
    );
  }

  addEnemy(action: any): void {
    const originalRoute = this.config.routes[action["routeIndex"]];
    const route = convertMovementConfig(originalRoute);

    // Create two geometries with different sizes
    const hitBoxGeo = new THREE.CircleGeometry(GameConfig.gridSize * 0.1, 32);
    const shadowGeometry = new THREE.PlaneGeometry(
      GameConfig.gridSize * 0.8,
      GameConfig.gridSize * 0.4
    );

    // Apply different materials
    const hitBoxMaterial = new THREE.MeshBasicMaterial({
      color: 0xf54029,
      depthTest: false,
    });
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: this.sprites.shadow,
      depthTest: false,
      opacity: 0.9,
      transparent: true, // Enable alpha transparency if the image has it
    });

    // Create two meshes
    const hitBoxMesh = new THREE.Mesh(hitBoxGeo, hitBoxMaterial);
    const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);

    // Offset the small mesh so they don't overlap perfectly
    hitBoxMesh.position.set(0.5, 0.5, 0.5);

    // Group both meshes
    const group = new THREE.Group();
    group.add(shadowMesh);
    group.add(hitBoxMesh);

    const enemyData = {
      key: action["key"],
      stats: {
        hp: 1,
        speed: 1,
      },
    };
    const atlas = this.spineAssetManager.get("enemy_1111_ucommd_2.atlas");
    const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
    const skeletonBinary = new spine.SkeletonBinary(atlasLoader);
    skeletonBinary.scale = 0.4;
    const skeletonData = skeletonBinary.readSkeletonData(
      this.spineAssetManager.get("enemy_1111_ucommd_2.skel")
    );
    const skeletonMesh = new spine.SkeletonMesh(skeletonData, (parameters) => {
      parameters.depthTest = false;
      parameters.alphaTest = 0.001;
    });
    group.add(skeletonMesh);
    const enemy = new Enemy(enemyData, route, group, skeletonMesh);
    this.objects.push(skeletonMesh);
    this.enemies.push(enemy);
    this.scene.add(group);
  }

  update(deltaTime: number): void {
    for (const enemy of this.enemies.filter((e) => e.alive)) {
      enemy.update(deltaTime);
    }
  }
}
