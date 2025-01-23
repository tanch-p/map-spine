import * as THREE from 'three';

export class FadingLine {
  constructor(scene, maxPoints = 100) {
    this.scene = scene;
    this.maxPoints = maxPoints;
    this.points = [];
    this.lineGeometry = new THREE.BufferGeometry();
    this.lineMaterial = new THREE.LineBasicMaterial({ 
      vertexColors: true,
      linewidth: 3
    });
    this.line = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.scene.add(this.line);
  }

  addPoint(x, y, z) {
    // Track the new point
    this.points.push({ x, y, z });

    // Remove excess points if over max
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }

    // Rebuild geometry with color gradient
    this.updateGeometry();
  }

  updateGeometry() {
    // Prepare arrays for vertices and colors
    const vertices = [];
    const colors = [];

    // Create color gradient based on point age
    for (let i = 0; i < this.points.length - 1; i++) {
      const point1 = this.points[i];
      const point2 = this.points[i + 1];

      // Calculate color intensity based on point's relative age
      const ageIntensity = 1;
      const color1 = new THREE.Color(1 - ageIntensity, 1 - ageIntensity, 1 - ageIntensity);
      const color2 = new THREE.Color(1 - (ageIntensity + 0.1), 1 - (ageIntensity + 0.1), 1 - (ageIntensity + 0.1));

      // Add vertices
      vertices.push(point1.x, point1.y, point1.z);
      vertices.push(point2.x, point2.y, point2.z);

      // Add colors
      colors.push(color1.r, color1.g, color1.b);
      colors.push(color2.r, color2.g, color2.b);
    }

    // Update geometry
    this.lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    // this.lineGeometry.computeBoundingSphere();
  }
}