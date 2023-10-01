function generateMaze(width, height) {
  switch (settings.mapAlgorithm) {
    case 0:
      return this.generatePrim(width, height);
    case 1:
      return this.generateCellular(width, height);
    case 2:
      return this.generateRandom(width, height);
    default:
      throw new Error(`Wtf`)
  }
}
function generatePrim(width, height)  {
  // generates a maze using a modified prim's algorithm
  const grid = [];
  for (let i = 0; i < width; i++) {
    grid.push([]);
    for (let j = 0; j < height; j++) {
      grid[i].push(1);
    }
  }
  const queue = [];
  const point = (x, y) => {
    if (x < 0) x = width - 1;
    if (width <= x) x = 0;
    if (y < 0) y = height - 1;
    if (height <= y) y = 0;
    return {x: x, y: y};
  };
  const add = (x, y) => {
    queue.push(point(x, y));
  };

  const startX = Math.floor(Math.random() * width);
  const startY = Math.floor(Math.random() * height);

  add(startX, startY);
  add(startX-1, startY);
  add(startX+1, startY);
  add(startX, startY-1);
  add(startX, startY+1);

  let fix = 0; // making sure an infinite loop doesn't happen
  while (fix++ < width ** 2 * height ** 2 && queue.length) {
    const queueCellIndex = Math.floor(Math.random() * queue.length);
    const currentCell = queue[queueCellIndex];

    let amount = 0, pos;
    pos = point(currentCell.x - 1, currentCell.y);
    if (grid[pos.x][pos.y] <= 0) amount++;
    pos = point(currentCell.x + 1, currentCell.y);
    if (grid[pos.x][pos.y] <= 0) amount++;
    pos = point(currentCell.x, currentCell.y - 1);
    if (grid[pos.x][pos.y] <= 0) amount++;
    pos = point(currentCell.x, currentCell.y + 1);
    if (grid[pos.x][pos.y] <= 0) amount++;

    if (amount < 2) {
      grid[currentCell.x][currentCell.y] = 0;
      add(currentCell.x-1, currentCell.y);
      add(currentCell.x+1, currentCell.y);
      add(currentCell.x, currentCell.y-1);
      add(currentCell.x, currentCell.y+1);
    }

    queue.splice(queueCellIndex, 1);
  }

  return grid;
}
function generateCellular(width, height) {
  let grid = [];
  for (let i = 0; i < width; i++) {
    grid.push([]);
    for (let j = 0; j < height; j++) {
      grid[i].push(Math.random() > 0.5);
    }
  }

  const nCount = (grid, x, y) => {
    let count = 0;
    const a = (xp, yp) => {
      if ((0 <= xp && xp < grid.length) && (0 <= yp && yp < grid[0].length))
        count += +grid[xp][yp];
    }
    a(x-1,y-1);
    a(x,y-1);
    a(x+1,y-1);
    a(x+1,y);
    a(x+1,y+1);
    a(x,y+1);
    a(x-1,y+1);
    a(x-1,y);
    return count;
  }

  for (let i = 0; i < settings.mapCellularIterations; i++) {
    const newGrid = [];
    for (let x = 0; x < width; x++) {
      newGrid.push([]);
      for (let y = 0; y < height; y++) {
        newGrid[x].push(grid[x][y]);
      }
    }

    for (let x = 0; x < grid.length; x++)
      for (let y = 0; y < grid[x].length; y++) {
        if (grid[x][y] == 0) {
          if (nCount(grid, x, y) == 3)
            newGrid[x][y] = 1;
        } else {
          const n = nCount(grid, x, y)
          if (settings.mapCellularStraight == 1 && (2 <= n && n <= 4))
            newGrid[x][y] = 1;
          else if (settings.mapCellularStraight == 0 && (1 <= n && n <= 4))
            newGrid[x][y] = 1;
          else if (settings.mapCellularStraight == 2 && (1 <= n && n <= 5))
            newGrid[x][y] = 1;
          else 
            newGrid[x][y] = 0;
        }
      }

    grid = newGrid;
  }

  for (let x = 0; x < grid.length; x++)
      for (let y = 0; y < grid[x].length; y++) {
        grid[x][y] = +!grid[x][y];
      }

  return grid;
}
function generateRandom(width, height) {
  const grid = [];
  for (let i = 0; i < width; i++) {
    grid.push([]);
    for (let j = 0; j < height; j++) {
      grid[i].push(+(Math.random() < settings.mapRandomChance / 10));
    }
  }
  return grid;
}