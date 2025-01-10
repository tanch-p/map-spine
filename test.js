// A* Algorithm in JavaScript
function heuristic(a, b) {
    // Calculate Manhattan distance as the heuristic
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function aStar(maze, start, goal) {
    const rows = maze.length;
    const cols = maze[0].length;

    function getNeighbors(pos) {
        // Get valid neighbors by checking all possible paths
        const neighbors = [];
        for (let nx = 0; nx < rows; nx++) {
            for (let ny = 0; ny < cols; ny++) {
                if (
                    (nx !== pos[0] || ny !== pos[1]) && // Exclude current position
                    maze[nx][ny] === 0 && // Must be a path
                    isPathClear(pos, [nx, ny]) // Path between pos and [nx, ny] must be clear
                ) {
                    neighbors.push([nx, ny]);
                }
            }
        }
        return neighbors;
    }

    function isPathClear(start, end) {
        // Check if the straight path between start and end is clear
        const [x1, y1] = start;
        const [x2, y2] = end;

        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const steps = Math.max(dx, dy);
        const xStep = (x2 - x1) / steps;
        const yStep = (y2 - y1) / steps;

        let x = x1;
        let y = y1;
        for (let i = 0; i <= steps; i++) {
            const roundedX = Math.round(x);
            const roundedY = Math.round(y);

            if (maze[roundedX] === undefined || maze[roundedX][roundedY] === undefined || maze[roundedX][roundedY] === 1) {
                return false;
            }

            x += xStep;
            y += yStep;
        }

        return true;
    }

    const openSet = [];
    openSet.push({ pos: start, fScore: heuristic(start, goal), gScore: 0 });
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(start.toString(), 0);

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.fScore - b.fScore);
        const current = openSet.shift();
        const [cx, cy] = current.pos;

        if (cx === goal[0] && cy === goal[1]) {
            // Reconstruct the path
            const path = [];
            let currentPos = current.pos;
            while (cameFrom.has(currentPos.toString())) {
                path.push(currentPos);
                currentPos = cameFrom.get(currentPos.toString());
            }
            path.push(start);
            return path.reverse();
        }

        for (const neighbor of getNeighbors(current.pos)) {
            const tentativeGScore = gScore.get(current.pos.toString()) + heuristic(current.pos, neighbor);

            if (!gScore.has(neighbor.toString()) || tentativeGScore < gScore.get(neighbor.toString())) {
                cameFrom.set(neighbor.toString(), current.pos);
                gScore.set(neighbor.toString(), tentativeGScore);
                const fScore = tentativeGScore + heuristic(neighbor, goal);
                openSet.push({ pos: neighbor, fScore, gScore: tentativeGScore });
            }
        }
    }

    return null; // No path found
}

// Maze layout
const maze = [
    [1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Start and goal positions
const start = [1, 0];
const goal = [2, 5];

// Find and print the shortest path
const path = aStar(maze, start, goal);
console.log("Shortest Path:", path);
