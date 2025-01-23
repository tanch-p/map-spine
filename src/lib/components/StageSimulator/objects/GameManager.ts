import * as THREE from "three";

export class GameManager {
  private static instance: GameManager;
  private constructor() {
    // Private constructor to prevent instantiation
  }
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }
  static gridSize: number = 100;
  static mazeLayout: [number[]];
  static pathFinder;
  static speedFactor: number = 2;
  static sprites = new Map();
  static baseZIndex = 0;
  static clock: THREE.Clock;

  // Game state
  public currentStage: string = ""; 
  public config;
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public objects;
  public renderer: THREE.WebGLRenderer;
  
  public setStageData(config): void {
    this.config = config;
  }
}
