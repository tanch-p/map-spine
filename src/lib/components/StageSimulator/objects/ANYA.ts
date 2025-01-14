class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}

class Node {
    constructor(point, parent = null) {
        this.point = point;
        this.parent = parent;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }
}

class TrueANYA {
    constructor(grid) {
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
        this.openSet = [];
        this.closedSet = new Map();
        // Store corner points for visibility checks
        this.corners = this.findCorners();
    }

    findCorners() {
        const corners = [];
        // Find all corner points (where obstacles meet open space)
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.isCorner(x, y)) {
                    corners.push(new Point(x, y));
                }
            }
        }
        return corners;
    }

    isCorner(x, y) {
        if (!this.isValidPosition(x, y)) return false;
        
        // Check if this point is at the corner of an obstacle
        const current = this.grid[y][x];
        const neighbors = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];

        let obstacleCount = 0;
        let openCount = 0;

        for (const [dx, dy] of neighbors) {
            const newX = x + dx;
            const newY = y + dy;
            
            if (!this.isValidPosition(newX, newY)) continue;
            
            if (this.grid[newY][newX] === 1) {
                obstacleCount++;
            } else {
                openCount++;
            }
        }

        // Point is a corner if it's walkable and has both obstacles and open spaces around it
        return this.grid[y][x] === 0 && obstacleCount > 0 && openCount > 0;
    }

    findPath(startX, startY, endX, endY) {
        const start = new Point(startX, startY);
        const end = new Point(endX, endY);

        if (!this.isWalkable(start) || !this.isWalkable(end)) {
            return null;
        }

        const startNode = new Node(start);
        startNode.h = start.distanceTo(end);
        startNode.f = startNode.h;

        this.openSet = [startNode];

        while (this.openSet.length > 0) {
            const current = this.getLowestFScore();
            
            if (this.hasLineOfSight(current.point, end)) {
                // If we can reach the end directly, add it and finish
                const finalNode = new Node(end, current);
                finalNode.g = current.g + current.point.distanceTo(end);
                return this.reconstructPath(finalNode);
            }

            const key = `${current.point.x},${current.point.y}`;
            this.closedSet.set(key, current);

            // Get all visible successors
            this.generateVisibleSuccessors(current, end);
        }

        return null;
    }

    generateVisibleSuccessors(node, goal) {
        // Consider all corner points and the goal as potential next points
        const potentialPoints = [...this.corners, goal];

        for (const point of potentialPoints) {
            if (point.equals(node.point)) continue;

            // Check if we have line of sight to this point
            if (this.hasLineOfSight(node.point, point)) {
                const successor = new Node(point, node);
                const key = `${point.x},${point.y}`;

                if (this.closedSet.has(key)) {
                    continue;
                }

                const tentativeG = node.g + node.point.distanceTo(point);

                const existingNode = this.openSet.find(n => 
                    n.point.x === point.x && n.point.y === point.y
                );

                if (!existingNode) {
                    successor.g = tentativeG;
                    successor.h = point.distanceTo(goal);
                    successor.f = successor.g + successor.h;
                    this.openSet.push(successor);
                } else if (tentativeG < existingNode.g) {
                    existingNode.g = tentativeG;
                    existingNode.f = tentativeG + existingNode.h;
                    existingNode.parent = node;
                }
            }
        }
    }

    hasLineOfSight(from, to) {
        // Use ray casting to check if there's a clear line of sight
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return true;

        const steps = Math.ceil(distance * 2); // Check twice per grid cell for accuracy
        
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = from.x + dx * t;
            const y = from.y + dy * t;
            
            // Check the four grid cells around this point
            const gridX = Math.floor(x);
            const gridY = Math.floor(y);
            
            for (let checkX = gridX; checkX <= gridX + 1; checkX++) {
                for (let checkY = gridY; checkY <= gridY + 1; checkY++) {
                    if (!this.isValidPosition(checkX, checkY) || this.grid[checkY][checkX] === 1) {
                        // Check if the line passes through this cell
                        if (this.lineIntersectsCell(from, to, checkX, checkY)) {
                            return false;
                        }
                    }
                }
            }
        }
        
        return true;
    }

    lineIntersectsCell(from, to, cellX, cellY) {
        // Check if line segment intersects with cell boundaries
        const x1 = from.x;
        const y1 = from.y;
        const x2 = to.x;
        const y2 = to.y;
        
        // Cell boundaries
        const left = cellX;
        const right = cellX + 1;
        const top = cellY;
        const bottom = cellY + 1;
        
        // Check intersection with cell boundaries
        if (this.lineIntersectsSegment(x1, y1, x2, y2, left, top, left, bottom) ||
            this.lineIntersectsSegment(x1, y1, x2, y2, right, top, right, bottom) ||
            this.lineIntersectsSegment(x1, y1, x2, y2, left, top, right, top) ||
            this.lineIntersectsSegment(x1, y1, x2, y2, left, bottom, right, bottom)) {
            return true;
        }
        
        return false;
    }

    lineIntersectsSegment(x1, y1, x2, y2, x3, y3, x4, y4) {
        // Check if two line segments intersect
        const denominator = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
        if (denominator === 0) return false;
        
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
        
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    getLowestFScore() {
        let lowestIndex = 0;
        for (let i = 1; i < this.openSet.length; i++) {
            if (this.openSet[i].f < this.openSet[lowestIndex].f) {
                lowestIndex = i;
            }
        }
        return this.openSet.splice(lowestIndex, 1)[0];
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }

    isWalkable(point) {
        return this.isValidPosition(point.x, point.y) && this.grid[point.y][point.x] === 0;
    }

    reconstructPath(node) {
        const path = [];
        let current = node;
        while (current !== null) {
            path.unshift([current.point.x, current.point.y]);
            current = current.parent;
        }
        return path;
    }
}