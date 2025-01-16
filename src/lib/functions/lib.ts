import { GameConfig } from "$lib/components/StageSimulator/objects/GameConfig";

//center is 0,0
export function setPosition(object, coordinates: number[]) {
  const x = coordinates[0];
  const y = coordinates[1];
  const posX = getCoordinate(x, "x");
  const posY = getCoordinate(y, "y");

  object.position.x = posX;
  object.position.y = posY;
  console.log(posX, posY);
}

export const normalToPos = (coordinates: number[]) => {
  const posX = getNormalPos(coordinates[0], "x");
  const posY = getNormalPos(coordinates[1], "y");
  return { posX, posY };
};

export const gameToPos = (
  coordinates: number[] //x,y
) => {
  const posX = getCoordinate(coordinates[0], "x");
  const posY = getCoordinate(coordinates[1], "y");
  return { posX, posY };
};

const getCoordinate = (coordinate, type = "x") => {
  const center =
    type === "x"
      ? GameConfig.mazeLayout[0].length / 2
      : GameConfig.mazeLayout.length / 2;
  if (coordinate === center) {
    if (center % 2 === 0) {
      return GameConfig.gridSize / 2;
    } else {
      return 0;
    }
  }
  return (coordinate - center) * GameConfig.gridSize + GameConfig.gridSize / 2;
};

// use normal pos here instead of game pos
export const getVectorCoordinates = (pos, reachOffset) => {
  let offSetX = 0,
    offSetY = 0;
  if (reachOffset) {
    offSetX = reachOffset.x;
    offSetY = reachOffset.y;
  }
  const { row, col } = pos;
  const x = getCoordinate(col + offSetX, "x");
  const y = -getCoordinate(row - offSetY, "y");
  return { x, y };
};

export const getNormalPos = (coordinate, type = "x") => {
  const center =
    type === "x"
      ? GameConfig.mazeLayout[0].length / 2
      : GameConfig.mazeLayout.length / 2;
  if (coordinate === center) {
    if (center % 2 === 0) {
      return GameConfig.gridSize / 2;
    } else {
      return 0;
    }
  }
  return type === "x"
    ? (coordinate - center) * GameConfig.gridSize + GameConfig.gridSize / 2
    : (center - 1 - coordinate) * GameConfig.gridSize + GameConfig.gridSize / 2;
};

export const convertMovementConfig = (config) => {
  const height = GameConfig.mazeLayout.length;
  const start = {
    row: height - 1 - config.startPosition.row,
    col: config.startPosition.col,
  };
  const end = {
    row: height - 1 - config.endPosition.row,
    col: config.endPosition.col,
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
