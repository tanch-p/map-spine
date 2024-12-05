import * as THREE from "three";

class GridSystem {
  public width;
  public cellSize;
  public height;
  public xDivisions;
  public yDivisions;
  private color1;
  private color2;
  constructor(
    height = 10,
    width = 10,
    yDivisions = 10,
    xDivisions = 10,
    cellSize = 60,
    color1 = 0x444444,
    color2 = 0x888888
  ) {
    this.width = width;
    this.height = height;
    this.xDivisions = xDivisions;
    this.yDivisions = yDivisions;
    this.cellSize = cellSize;
    this.color1 = new THREE.Color(color1);
    this.color2 = new THREE.Color(color2);
  }

  // Convert world coordinates to grid coordinates (bottom-left origin)
  worldToGridCoords(x, y) {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    return { x: gridX, y: gridY };
  }

  // Convert grid coordinates to world coordinates (bottom-left origin, center of cell)
  gridToWorldCoords(gridX, gridY) {
    const worldX = (gridX + 0.5) * this.cellSize;
    const worldY = (gridY + 0.5) * this.cellSize;
    return { x: worldX, y: worldY };
  }

  // Check if coordinates are within grid bounds
  isValidGridPosition(gridX, gridY) {
    return (
      gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height
    );
  }

  // Create a grid visualization using LineSegments
  createGridHelper() {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    const stepX = this.width / this.xDivisions;
    const stepY = this.height / this.yDivisions;

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    // Vertical lines (along X-axis)
    for (let i = 0; i <= this.xDivisions; i++) {
      const x = -halfWidth + i * stepX;
      vertices.push(x, -halfHeight, 0, x, halfHeight, 0);

      const color =
        i === Math.floor(this.xDivisions / 2) ? this.color1 : this.color2;
      color.toArray(colors, colors.length);
      color.toArray(colors, colors.length);
    }

    // Horizontal lines (along Y-axis)
    for (let j = 0; j <= this.yDivisions; j++) {
      const y = -halfHeight + j * stepY;
      vertices.push(-halfWidth, y, 0, halfWidth, y, 0);

      const color =
        j === Math.floor(this.yDivisions / 2) ? this.color1 : this.color2;
      color.toArray(colors, colors.length);
      color.toArray(colors, colors.length);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      toneMapped: false,
    });

    return new THREE.LineSegments(geometry, material);
  }

  // Example method to get neighboring cells
  getNeighbors(gridX, gridY) {
    return [
      { x: gridX + 1, y: gridY }, // Right
      { x: gridX - 1, y: gridY }, // Left
      { x: gridX, y: gridY + 1 }, // Up
      { x: gridX, y: gridY - 1 }, // Down
    ].filter((pos) => this.isValidGridPosition(pos.x, pos.y));
  }
}

export { GridSystem };
