import * as PIXI from "pixi.js";

export class Interface {
  private container: any;
  private actions: any;
  private unit: any;
  private timeScale: number;

  constructor(config: any) {
    this.container = config.container || null;
    this.actions = config.actions;
    this.unit = config.unit;
    this.timeScale = 1;
    // Init
    this.onInit();
  }
  onInit(): void {
    this.drawInterface(this.unit);
  }
  drawInterface(unit): void {
    const actions = unit.spineData.animations.map((ele) => ele.name);
    actions.forEach((action, i) => {
      const frame = new PIXI.Graphics();
      frame.lineStyle(2, 0xffffff, 1);
      frame.drawRect(0, i * 20, 100, 20);
      const text = new PIXI.Text(`${action}`, {
        fill: 0xf3f3f3,
        fontSize: 14,
      });
      text.x = 10;
      text.y = i * 20 + 2;
      frame.addChild(text);
      frame.x = -this.container.x + 100;
      frame.eventMode = "static";
      frame.cursor = "pointer";
      frame.on("click", () => this.handleClick(action, unit));
      this.container.addChild(frame);
    });

    // timescale
    const frame = new PIXI.Graphics();
    frame.lineStyle(2, 0xffffff, 1);
    frame.drawRect(0, 160, 100, 20);
    const text = new PIXI.Text(`${this.timeScale}`, {
      fill: 0xf3f3f3,
      fontSize: 14,
    });
    text.x = 10;
    text.y = 160 + 2;
    frame.addChild(text);
    frame.x = -this.container.x + 100;
    frame.eventMode = "static";
    frame.cursor = "pointer";
    frame.on("click", () => this.changeTimeScale(unit,frame));
    this.container.addChild(frame);
  }
  handleClick(action, unit) {
    console.log(action);
    if (unit.state.hasAnimation(action)) {
      unit.state.setAnimation(0, action, true);
    }
  }
  changeTimeScale(unit,frame) {
    if (this.timeScale === 1) {
      this.timeScale = 0.2;
    } else if (this.timeScale === 0.5) {
      this.timeScale = 1;
    } else if (this.timeScale === 0.2) {
      this.timeScale = 0.5;
    }
    frame.children[0].text=this.timeScale;
    unit.state.timeScale = this.timeScale;
  }
  //   drawTile(cols: number, rows: number): void {
  //     const gridSize = 80; //px
  //     for (let y = 0; y < rows; y++) {
  //       for (let x = 0; x < cols; x++) {
  //         const frame = new PIXI.Graphics();
  //         frame.lineStyle(2, 0xffffff, 1);
  //         frame.drawRect(x * gridSize, y * gridSize, gridSize, gridSize);
  //         const coords = new PIXI.Text(`${x},${rows - y - 1}`, {
  //           fill: 0xf3f3f3,
  //           fontSize: 14,
  //         });
  //         coords.x = x * gridSize + 6;
  //         coords.y = y * gridSize + 56;
  //         frame.addChild(coords);
  //         const tileNum = new PIXI.Text(this.mapData.map[y][x], {
  //           fill: 0xf3f3f3,
  //           fontSize: 14,
  //         });
  //         tileNum.x = x * gridSize + 30;
  //         tileNum.y = y * gridSize + 30;
  //         frame.addChild(tileNum);
  //         this.container.addChild(frame);
  //       }
  //     }
  //   }
}
