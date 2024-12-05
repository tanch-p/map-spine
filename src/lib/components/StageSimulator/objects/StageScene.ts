import * as THREE from "three";
import { GridSystem } from "./GridSystem";

// Example usage in a game scene setup
class StageScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public gridSystem: GridSystem;
  public player: THREE.Mesh;

  constructor(
    canvasElement: HTMLCanvasElement,
    gridSize,
    rows: number,
    cols: number
  ) {
    // Set up Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, // field of view
      4 / 3, // aspect ratio
      0.1, // near clipping plane
      1000 // far clipping plane
    );
    // Position camera to view XY plane from an angle
    this.camera.position.y = 0;
    this.camera.position.z = 400;
    // camera.rotation.x = 0.194; // Tilt up slightly
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true, // Optional: smoother edges
      alpha: true,
    });
    this.renderer.setClearColor(0x0000, 1);
    this.renderer.setSize(800, 600);
    // this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Create grid system
    this.gridSystem = new GridSystem(
      rows * gridSize,
      cols * gridSize,
      rows,
      cols,
      1
    );

    // Add grid visualization
    const gridHelper = this.gridSystem.createGridHelper();
    this.scene.add(gridHelper);

    // Example of adding an object to the grid
    this.addPlayerToGrid(0, 0);

    // Set up mouse interaction
    this.setupMouseInteraction();
  }

  addPlayerToGrid(gridX, gridY) {
    const { x, y } = this.gridSystem.gridToWorldCoords(gridX, gridY);

    const playerGeometry = new THREE.PlaneGeometry(50, 50);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.player = new THREE.Mesh(playerGeometry, playerMaterial);

    this.player.position.set(0, 0, 0);
    this.scene.add(this.player);
  }

  setupMouseInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener("click", (event) => {
      // Normalize mouse coordinates
      mouse.x = (event.clientX / window.innerWidth) * 10;
      mouse.y = 10 - (event.clientY / window.innerHeight) * 10;

      // Raycasting
      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.scene.children);

      if (intersects.length > 0) {
        const { x: gridX, y: gridY } = this.gridSystem.worldToGridCoords(
          intersects[0].point.x,
          intersects[0].point.y
        );

        console.log(`Clicked grid coordinates: (${gridX}, ${gridY})`);
      }
    });
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}

export { StageScene };
