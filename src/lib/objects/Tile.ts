import * as PIXI from "pixi.js";

export class Tile {
  public texture: any;
  public sprite: any;
  public tileKey: any;
  public heightType: any;
  public buildableType: any;
  public passableMask: any;
  public playerSideMask: any;
  public blackboard: any;
  public effects: any;

  constructor(config: any) {
    this.texture = config.texture || null;
    this.tileKey = config.tileKey || null;
    this.heightType = config.heightType || null;
    this.buildableType = config.buildableType || null;
    this.passableMask = config.passableMask || null;
    this.playerSideMask = config.playerSideMask || null;
    this.blackboard = config.blackboard || null;
    this.effects = config.effects || null;

    // Init
    this.onInit();
  }
  onInit(): void {
    this.sprite = PIXI.Sprite.from(this.texture);
    this.sprite.width = this.sprite.width;
    this.sprite.height = this.sprite.height;
  }
}
