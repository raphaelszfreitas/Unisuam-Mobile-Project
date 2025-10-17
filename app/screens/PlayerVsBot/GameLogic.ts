import { Piece, Player, Position } from "./types";

export const BOARD_SIZE = 8;

export function createInitialBoard(): Piece[][] {
  const board: Piece[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(null),
  );
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const isDark = (row + col) % 2 === 1;
      if (!isDark) continue;
      if (row < 3) board[row][col] = "white";
      else if (row > 4) board[row][col] = "red";
    }
  }
  return board;
}

export function isKing(piece: Piece) {
  return piece === "whiteKing" || piece === "redKing";
}

export function getColor(piece: Piece): Player | null {
  if (piece === "white" || piece === "whiteKing") return "white";
  if (piece === "red" || piece === "redKing") return "red";
  return null;
}

export function isPathClear(
  board: Piece[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
): boolean {
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;
  const dr = rowDiff > 0 ? 1 : -1;
  const dc = colDiff > 0 ? 1 : -1;
  let r = fromRow + dr;
  let c = fromCol + dc;
  while (r !== toRow && c !== toCol) {
    if (board[r][c] !== null) return false;
    r += dr;
    c += dc;
  }
  return true;
}

export function kingCapturedPosIfCapture(
  board: Piece[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  piece: Piece,
): { row: number; col: number } | null {
  if (!isKing(piece)) return null;
  if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return null;
  if (board[toRow][toCol] !== null) return null;

  const color = getColor(piece)!;
  const dr = toRow > fromRow ? 1 : -1;
  const dc = toCol > fromCol ? 1 : -1;
  let r = fromRow + dr;
  let c = fromCol + dc;
  let enemy: { row: number; col: number } | null = null;

  while (r !== toRow && c !== toCol) {
    const cell = board[r][c];
    if (cell !== null) {
      if (getColor(cell) === color) return null;
      if (enemy) return null;
      enemy = { row: r, col: c };
    }
    r += dr;
    c += dc;
  }

  return enemy;
}

export function hasAnotherCapture(
  board: Piece[][],
  row: number,
  col: number,
  piece: Piece,
): boolean {
  if (!piece) return false;
  const color = getColor(piece)!;

  if (isKing(piece)) {
    const dirs = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      let enemyFound = false;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const cell = board[r][c];
        if (cell === null) {
          if (enemyFound) return true;
          r += dr;
          c += dc;
          continue;
        }
        if (getColor(cell) === color) break;
        if (!enemyFound) {
          enemyFound = true;
          r += dr;
          c += dc;
          continue;
        }
        break;
      }
    }
    return false;
  } else {
    const forward = piece === "white" ? 1 : -1;
    const dirs = [
      [forward, 1],
      [forward, -1],
    ];
    for (const [dr, dc] of dirs) {
      const midR = row + dr;
      const midC = col + dc;
      const landR = row + dr * 2;
      const landC = col + dc * 2;
      if (
        midR >= 0 &&
        midR < BOARD_SIZE &&
        midC >= 0 &&
        midC < BOARD_SIZE &&
        landR >= 0 &&
        landR < BOARD_SIZE &&
        landC >= 0 &&
        landC < BOARD_SIZE
      ) {
        const mid = board[midR][midC];
        if (mid && getColor(mid) !== color && board[landR][landC] === null)
          return true;
      }
    }
    return false;
  }
}

export function getAvailableMoves(
  row: number,
  col: number,
  piece: Piece,
  board: Piece[][],
): Position[] {
  if (!piece) return [];
  const moves: Position[] = [];
  const color = getColor(piece)!;

  if (isKing(piece)) {
    const dirs = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      let enemyfound = false;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const cell = board[r][c];
        if (cell === null) {
          moves.push({ row: r, col: c });
        } else {
          if (getColor(cell) === color) break;
          if (enemyfound) break;
          enemyfound = true;
        }
        r += dr;
        c += dc;
      }
    }
  } else {
    const forward = piece === "white" ? 1 : -1;

    for (const dc of [-1, 1]) {
      const r = row + forward;
      const c = col + dc;
      if (
        r >= 0 &&
        r < BOARD_SIZE &&
        c >= 0 &&
        c < BOARD_SIZE &&
        board[r][c] === null
      )
        moves.push({ row: r, col: c });
    }

    for (const dc of [-1, 1]) {
      const midR = row + forward;
      const midC = col + dc;
      const landR = row + forward * 2;
      const landC = col + dc * 2;
      if (
        landR >= 0 &&
        landR < BOARD_SIZE &&
        landC >= 0 &&
        landC < BOARD_SIZE &&
        board[midR][midC] &&
        getColor(board[midR][midC]) !== color &&
        board[landR][landC] === null
      ) {
        moves.push({ row: landR, col: landC });
      }
    }
  }

  return moves;
}
