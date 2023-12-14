import * as PIXI from "pixi.js";
import { tile } from "./stores";

export class Map {
  private container: any;
  private mapData: any;
  public tiles: any;

  constructor(config: any) {
    this.container = config.container || null;
    this.mapData = config.mapData;

    // Init
    this.onInit();
  }
  onInit(): void {
    this.tiles = [];
    this.drawTile(this.mapData.map[0].length, this.mapData.map.length);
  }

  drawTile(cols: number, rows: number): void {
    const gridSize = 80; //px
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const frame = new PIXI.Graphics();
        frame.lineStyle(2, 0xffffff, 1);
        frame.drawRect(x * gridSize, y * gridSize, gridSize, gridSize);
        const coords = new PIXI.Text(`${x},${rows - y - 1}`, {
          fill: 0xf3f3f3,
          fontSize: 14,
        });
        coords.x = x * gridSize + 6;
        coords.y = y * gridSize + 56;
        frame.addChild(coords);
        const tileNum = new PIXI.Text(this.mapData.map[y][x], {
          fill: 0xf3f3f3,
          fontSize: 14,
        });
        tileNum.x = x * gridSize + 30;
        tileNum.y = y * gridSize + 30;
        frame.addChild(tileNum);
        this.container.addChild(frame);
      }
    }
  }
}
