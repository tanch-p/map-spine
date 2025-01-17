import * as THREE from "three";
import { GameConfig } from "./GameConfig";

export class TileManager {

  constructor(
    map=""
  ) {
    const gridSize = GameConfig.gridSize;
    const floorIcons = GameConfig.sprites.get("floorIcons")
    
  }

  get() {
    return this.sprite;
  }
}
