export const visualizePath() {
    // Remove existing path visualization if any
    if (this.pathLine) {
      scene.remove(this.pathLine);
    }
    this.waypointMarkers.forEach((marker) => scene.remove(marker));
    this.waypointMarkers = [];

    // Create path line
    const points = this.detailedPath.map((pos) => {
      return new THREE.Vector3(
        getNormalPos(pos.col, this.mazeLayout, gridSize, "x"),
        getNormalPos(pos.row, this.mazeLayout, gridSize, "y"),
        0.2
      );
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2,
    });
    this.pathLine = new THREE.Line(geometry, material);
    scene.add(this.pathLine);

    // Add waypoint markers
    const waypointGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const waypointMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });

    // Checkpoints
    this.config.checkpoints.forEach((checkpoint) => {
      const marker = new THREE.Mesh(waypointGeometry, waypointMaterial);
      marker.position.set(
        getNormalPos(checkpoint.position.col, this.mazeLayout, gridSize, "x"),
        getNormalPos(checkpoint.position.row, this.mazeLayout, gridSize, "y"),
        0.2
      );
      this.waypointMarkers.push(marker);
      scene.add(marker);
    });

    // Add progress line
    this.updateProgressLine();
  }

  updateProgressLine() {
    // Remove existing progress line if any
    if (this.progressLine) {
      scene.remove(this.progressLine);
    }

    // Create progress line (showing completed path)
    const progressPoints = this.detailedPath
      .slice(0, this.currentPathIndex + 1)
      .map((pos) => {
        return new THREE.Vector3(
          getNormalPos(pos.col, this.mazeLayout, gridSize, "x"),
          getNormalPos(pos.row, this.mazeLayout, gridSize, "y"),
          0.2
        );
      });

    if (progressPoints.length > 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints(
        progressPoints
      );
      const material = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 3,
      });
      this.progressLine = new THREE.Line(geometry, material);
      scene.add(this.progressLine);
    }
  }