import * as THREE from "three";
import { GameManager } from "../objects/GameManager";
import { getVectorCoordinates } from "$lib/functions/lib";
import { GameConfig } from "../objects/GameConfig";
import { TextSprite } from "../objects/TextSprite";

export const visualizePath = (paths, currentActionIndex, startPos) => {
  const gameManager = GameManager.getInstance();
  const remainingPaths = paths.filter((ele, i) => i >= currentActionIndex);
  const lineGroup = new THREE.Group();

  const movePaths = paths.filter((ele) => ele.type === "MOVE" || ele.type === "APPEAR_AT_POS");
  console.log(movePaths);
  for (let i = 0; i < movePaths.length-1; i++) {
    const startCoordinates = i === 0 ? startPos : movePaths[i].position;
    const startPoint = getVectorCoordinates(startCoordinates);
    const start = new THREE.Vector3(startPoint.x, startPoint.y, 0);
    // Define start and end points
    const endPoint = getVectorCoordinates(movePaths[i + 1].position);
    const end = new THREE.Vector3(endPoint.x, endPoint.y, 0);

    // Create a geometry and add the points
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

    // Create a material for the line
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red line

    // Create the line
    const line = new THREE.Line(geometry, material);
    lineGroup.add(line);
  }

  for (let i = 0; i < paths.length; i++) {
    const { type, pathType, time, position, reachOffset } = paths[i];
    const group = new THREE.Group();

    switch (type) {
      case "MOVE":
        if (pathType === "cp") {
          const geometry = new THREE.CircleGeometry(
            GameConfig.gridSize / 10,
            32
          );
          const material = new THREE.MeshBasicMaterial({ color: 0x00ee00 });
          const circle = new THREE.Mesh(geometry, material);
          const { x, y } = getVectorCoordinates(position, reachOffset);
          circle.position.set(x, y, GameConfig.baseZIndex + 10);
          group.add(circle);
        }
        break;
      case "WAIT_FOR_SECONDS":
        const geometry = new THREE.CircleGeometry(GameConfig.gridSize / 5, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const circle = new THREE.Mesh(geometry, material);
        const waitPosition = i === 0 ? startPos : paths[i - 1].position;
        const { x, y } = getVectorCoordinates(waitPosition, reachOffset);
        circle.renderOrder = 1;
        const text = new TextSprite(time).get();
        group.add(text);
        group.add(circle);
        group.position.set(x, y, GameConfig.baseZIndex + 15);
        break;
      default:
        break;
    }

    gameManager.scene.add(group, lineGroup);
  }

  // Inner circle (solid)
  const innerGeometry = new THREE.CircleGeometry(100, 64);
  const innerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);

  // if (this.pathLine) {
  //   scene.remove(this.pathLine);
  // }
  // this.waypointMarkers.forEach((marker) => scene.remove(marker));
  // this.waypointMarkers = [];

  // // Create path line
  // const points = this.detailedPath.map((pos) => {
  //   return new THREE.Vector3(
  //     getNormalPos(pos.col, this.mazeLayout, gridSize, "x"),
  //     getNormalPos(pos.row, this.mazeLayout, gridSize, "y"),
  //     0.2
  //   );
  // });

  // const geometry = new THREE.BufferGeometry().setFromPoints(points);
  // const material = new THREE.LineBasicMaterial({
  //   color: 0x00ff00,
  //   linewidth: 2,
  // });
  // this.pathLine = new THREE.Line(geometry, material);
  // scene.add(this.pathLine);

  // // Add waypoint markers
  // const waypointGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  // const waypointMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });

  // // Checkpoints
  // this.config.checkpoints.forEach((checkpoint) => {
  //   const marker = new THREE.Mesh(waypointGeometry, waypointMaterial);
  //   marker.position.set(
  //     getNormalPos(checkpoint.position.col, this.mazeLayout, gridSize, "x"),
  //     getNormalPos(checkpoint.position.row, this.mazeLayout, gridSize, "y"),
  //     0.2
  //   );
  //   this.waypointMarkers.push(marker);
  //   scene.add(marker);
  // });

  // // Add progress line
  // this.updateProgressLine();
};

//   updateProgressLine() {
//     // Remove existing progress line if any
//     if (this.progressLine) {
//       scene.remove(this.progressLine);
//     }

//     // Create progress line (showing completed path)
//     const progressPoints = this.detailedPath
//       .slice(0, this.currentPathIndex + 1)
//       .map((pos) => {
//         return new THREE.Vector3(
//           getNormalPos(pos.col, this.mazeLayout, gridSize, "x"),
//           getNormalPos(pos.row, this.mazeLayout, gridSize, "y"),
//           0.2
//         );
//       });

//     if (progressPoints.length > 1) {
//       const geometry = new THREE.BufferGeometry().setFromPoints(
//         progressPoints
//       );
//       const material = new THREE.LineBasicMaterial({
//         color: 0x0000ff,
//         linewidth: 3,
//       });
//       this.progressLine = new THREE.Line(geometry, material);
//       scene.add(this.progressLine);
//     }
//   }

function createFadingBorderCircleSprite(
  radius = 50,
  borderColor = 0x000000,
  borderWidth = 2
) {
  const canvas = document.createElement("canvas");
  canvas.width = radius * 2;
  canvas.height = radius * 2;
  const context = canvas.getContext("2d");

  // Create radial gradient
  const gradient = context.createRadialGradient(
    radius,
    radius,
    radius - borderWidth,
    radius,
    radius,
    radius
  );

  // Convert hex color to RGBA
  const r = (borderColor >> 16) & 255;
  const g = (borderColor >> 8) & 255;
  const b = borderColor & 255;

  // Gradient from solid color to transparent
  gradient.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw circle with gradient border
  context.beginPath();
  context.arc(radius, radius, radius, 0, Math.PI * 2, false);
  context.strokeStyle = gradient;
  context.lineWidth = borderWidth;
  context.stroke();

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);

  // Create sprite material
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  // Create and return the sprite
  return new THREE.Sprite(spriteMaterial);
}

function createCircleSprite(
  radius = 50,
  borderColor = 0x000000,
  borderWidth = 2
) {
  // Create a canvas for the sprite
  const canvas = document.createElement("canvas");
  canvas.width = radius * 2;
  canvas.height = radius * 2;
  const context = canvas.getContext("2d");

  // Clear the canvas (transparent background)
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the circle border
  context.beginPath();
  context.arc(radius, radius, radius - borderWidth / 2, 0, Math.PI * 2, false);
  context.strokeStyle = `#${borderColor.toString(16).padStart(6, "0")}`;
  context.lineWidth = borderWidth;
  context.stroke();

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);

  // Create sprite material
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  // Create and return the sprite
  return new THREE.Sprite(spriteMaterial);
}
