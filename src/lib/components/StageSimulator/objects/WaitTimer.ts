import * as THREE from "three";
import { GameManager } from "./GameManager";

export class WaitTimer {
  gameManager: GameManager;
  
  constructor(config, objects, spineAssetManager, spineScaleManager) {
    this.gameManager = GameManager.getInstance();

  }
}
