// tiles: [tile_type,heightType,mask]

// 0 is path, 1 is wall
export const generateMaze = (map,tiles) => {
    return map.reduce((acc,curr) => {
        const row = [];
        for(const index of curr){
            row.push(tiles[index][2])
        }
        acc.push(row);
        return acc;
    },[])
}

export const gameToPos = (
  coordinates: number[],
  mazeLayout: [number[]],
  gridSize = 50
) => {
  const rows = mazeLayout.length;
  const cols = mazeLayout[0].length;
  const posX = getCoordinate(coordinates[0],"x");
  const posY = getCoordinate(coordinates[1], "y");
  return { posX, posY };
};

const getCoordinate = (coordinate, center, gridSize) => {
    if (coordinate === center) {
      if (center % 2 === 0) {
        return gridSize / 2;
      } else {
        return 0;
      }
    }
    return (coordinate - center) * gridSize + gridSize / 2;
  };