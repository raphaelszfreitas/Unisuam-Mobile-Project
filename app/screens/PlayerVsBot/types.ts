export type Piece = "white" | "red" | "whiteKing" | "redKing" | null;
export type Position = { row: number; col: number };
export type Move = { from: Position; to: Position; isCapture: boolean };
export type Player = "white" | "red";
