//center is 0,0
export function setPosition(
  object,
  coordinates: number[],
  mazeLayout,
  gridSize = 50
) {
  const x = coordinates[0];
  const y = coordinates[1];
  const rows = mazeLayout.length;
  const cols = mazeLayout[0].length;
  const posX = getCoordinate(x, cols / 2, gridSize);
  const posY = getCoordinate(y, rows / 2, gridSize);

  object.position.x = posX;
  object.position.y = posY;
  console.log(posX, posY);
}

export const normalToPos = (
  coordinates: number[],
  mazeLayout: [number[]],
  gridSize = 50
) => {
  const rows = mazeLayout.length;
  const cols = mazeLayout[0].length;
  const posX = getNormalPos(coordinates[0], cols / 2, gridSize);
  const posY = getNormalPos(coordinates[1], rows / 2, gridSize, "y");
  return { posX, posY };
};

export const gameToPos = (
  coordinates: number[],
  mazeLayout: [number[]],
  gridSize = 50
) => {
  const rows = mazeLayout.length;
  const cols = mazeLayout[0].length;
  const posX = getCoordinate(coordinates[0], cols / 2, gridSize);
  const posY = getCoordinate(coordinates[1], rows / 2, gridSize);
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

export const getNormalPos = (coordinate, center, gridSize, type = "x") => {
  if (coordinate === center) {
    if (center % 2 === 0) {
      return gridSize / 2;
    } else {
      return 0;
    }
  }
  return type === "x"
    ? (coordinate - center) * gridSize + gridSize / 2
    : (center - 1 - coordinate) * gridSize + gridSize / 2;
};

export const convertMovementConfig = (config, mazeLayout) => {
  const height = mazeLayout.length;
  const start = {
    row: height - 1 - config.startPosition.row,
    col: config.startPosition.col,
  };
  const end = {
    row: height - 1 - config.endPosition.row,
    col: config.startPosition.col,
  };
  const checkpoints = [...config.checkpoints];
  for (const checkpoint of checkpoints) {
    checkpoint.position.row = height - 1 - checkpoint.position.row;
  }
  return {
    ...config,
    endPosition: end,
    startPosition: start,
    checkpoints: checkpoints,
  };
};
