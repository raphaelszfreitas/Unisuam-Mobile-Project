import {
  BOARD_SIZE,
  getAvailableMoves,
  getColor,
  isKing,
  kingCapturedPosIfCapture,
} from "./GameLogic";

// Tipos necessários para o bot (ajuste conforme o seu projeto)
type Player = "white" | "red";
type Piece = "white" | "red" | "whiteKing" | "redKing" | null;
interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  isCapture?: boolean;
}

// Função minimax para o bot difícil
function minimax(
  board: Piece[][],
  player: Player,
  depth: number,
  maximizing: boolean,
  alpha: number,
  beta: number,
  rootPlayer: Player,
): { score: number; move?: Move } {
  // Função de avaliação simples
  function evaluateBoard(board: Piece[][], player: Player): number {
    let score = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (!piece) continue;
        const color = getColor(piece);
        let value = 0;
        if (piece === "white" || piece === "red") value = 5;
        if (piece === "whiteKing" || piece === "redKing") value = 20;
        if (color === player) score += value;
        else score -= value;
      }
    }
    return score;
  }

  // Geração de movimentos
  const moves: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && getColor(piece) === player) {
        const pieceMoves = getAvailableMoves(row, col, piece, board);
        for (const move of pieceMoves) {
          let isCapture = false;
          if (isKing(piece)) {
            const captured = kingCapturedPosIfCapture(
              board,
              row,
              col,
              move.row,
              move.col,
              piece,
            );
            if (captured) isCapture = true;
          } else {
            if (Math.abs(move.row - row) === 2) isCapture = true;
          }
          moves.push({ from: { row, col }, to: move, isCapture });
        }
      }
    }
  }

  if (depth === 0 || moves.length === 0) {
    return { score: evaluateBoard(board, rootPlayer) };
  }

  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove: Move | undefined = undefined;

  for (const move of moves) {
    const tempBoard = board.map((r) => r.slice());
    const piece = tempBoard[move.from.row][move.from.col];
    tempBoard[move.from.row][move.from.col] = null;
    tempBoard[move.to.row][move.to.col] = piece;
    if (move.isCapture) {
      if (isKing(piece)) {
        const captured = kingCapturedPosIfCapture(
          board,
          move.from.row,
          move.from.col,
          move.to.row,
          move.to.col,
          piece,
        );
        if (captured) tempBoard[captured.row][captured.col] = null;
      } else {
        const midRow = Math.floor((move.from.row + move.to.row) / 2);
        const midCol = Math.floor((move.from.col + move.to.col) / 2);
        tempBoard[midRow][midCol] = null;
      }
    }
    let promoted = false;
    if (piece === "white" && move.to.row === BOARD_SIZE - 1) {
      tempBoard[move.to.row][move.to.col] = "whiteKing";
      promoted = true;
    }
    if (piece === "red" && move.to.row === 0) {
      tempBoard[move.to.row][move.to.col] = "redKing";
      promoted = true;
    }
    let nextPlayer: Player = player === "white" ? "red" : "white";
    if (move.isCapture && !promoted) {
      const nextPiece = tempBoard[move.to.row][move.to.col];
      const nextMoves = getAvailableMoves(
        move.to.row,
        move.to.col,
        nextPiece,
        tempBoard,
      );
      const canCaptureAgain = nextMoves.some((nm) => {
        if (isKing(nextPiece)) {
          const captured = kingCapturedPosIfCapture(
            tempBoard,
            move.to.row,
            move.to.col,
            nm.row,
            nm.col,
            nextPiece,
          );
          return !!captured;
        } else {
          return Math.abs(nm.row - move.to.row) === 2;
        }
      });
      if (canCaptureAgain) nextPlayer = player;
    }
    const result = minimax(
      tempBoard,
      nextPlayer,
      depth - 1,
      !maximizing,
      alpha,
      beta,
      rootPlayer,
    );
    if (maximizing) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break;
    }
  }
  return { score: bestScore, move: bestMove };
}

export async function chooseBotMove(
  board: Piece[][],
  player: Player,
  difficulty: string,
): Promise<Move | null> {
  const moves: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && getColor(piece) === player) {
        const pieceMoves = getAvailableMoves(row, col, piece, board);
        for (const move of pieceMoves) {
          let isCapture = false;
          if (isKing(piece)) {
            const captured = kingCapturedPosIfCapture(
              board,
              row,
              col,
              move.row,
              move.col,
              piece,
            );
            if (captured) isCapture = true;
          } else {
            if (Math.abs(move.row - row) === 2) isCapture = true;
          }
          moves.push({ from: { row, col }, to: move, isCapture });
        }
      }
    }
  }
  if (moves.length === 0) return Promise.resolve(null);

  if (difficulty === "easy") {
    const captures = moves.filter((m) => m.isCapture);
    if (captures.length > 0) {
      return Promise.resolve(
        captures[Math.floor(Math.random() * captures.length)],
      );
    }
    return Promise.resolve(moves[Math.floor(Math.random() * moves.length)]);
  }

  if (difficulty === "medium") {
    // 1. Prioritize captures, especially queen captures
    const captures = moves.filter((m) => m.isCapture);
    if (captures.length > 0) {
      const queenCaptures = captures.filter((m) => {
        const capturedPiece = (() => {
          if (isKing(board[m.from.row][m.from.col])) {
            const captured = kingCapturedPosIfCapture(
              board,
              m.from.row,
              m.from.col,
              m.to.row,
              m.to.col,
              board[m.from.row][m.from.col],
            );
            return captured ? board[captured.row][captured.col] : null;
          } else {
            const midRow = Math.floor((m.from.row + m.to.row) / 2);
            const midCol = Math.floor((m.from.col + m.to.col) / 2);
            return board[midRow][midCol];
          }
        })();
        return capturedPiece === (player === "white" ? "redKing" : "whiteKing");
      });
      if (queenCaptures.length > 0) {
        return Promise.resolve(
          queenCaptures[Math.floor(Math.random() * queenCaptures.length)],
        );
      }
      // Prefer multi-capture moves (if available)
      const multiCaptures = captures.filter((m) => {
        const tempBoard = board.map((r) => r.slice());
        const piece = tempBoard[m.from.row][m.from.col];
        tempBoard[m.from.row][m.from.col] = null;
        tempBoard[m.to.row][m.to.col] = piece;
        // Remove captured piece
        if (isKing(piece)) {
          const captured = kingCapturedPosIfCapture(
            board,
            m.from.row,
            m.from.col,
            m.to.row,
            m.to.col,
            piece,
          );
          if (captured) tempBoard[captured.row][captured.col] = null;
        } else {
          const midRow = Math.floor((m.from.row + m.to.row) / 2);
          const midCol = Math.floor((m.from.col + m.to.col) / 2);
          tempBoard[midRow][midCol] = null;
        }
        // Check if can capture again
        const nextMoves = getAvailableMoves(
          m.to.row,
          m.to.col,
          piece,
          tempBoard,
        );
        return nextMoves.some((nm) => {
          if (isKing(piece)) {
            const captured = kingCapturedPosIfCapture(
              tempBoard,
              m.to.row,
              m.to.col,
              nm.row,
              nm.col,
              piece,
            );
            return !!captured;
          } else {
            return Math.abs(nm.row - m.to.row) === 2;
          }
        });
      });
      if (multiCaptures.length > 0) {
        return Promise.resolve(
          multiCaptures[Math.floor(Math.random() * multiCaptures.length)],
        );
      }
      return Promise.resolve(
        captures[Math.floor(Math.random() * captures.length)],
      );
    }

    // 2. 1-ply minimax: for each move, simulate opponent's best reply
    function evaluateBoardSimple(board: Piece[][], player: Player): number {
      let score = 0;
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];
          if (!piece) continue;
          const color = getColor(piece);
          let value = 0;
          if (piece === "white" || piece === "red") value = 5;
          if (piece === "whiteKing" || piece === "redKing") value = 20;
          // Center bonus
          if (col >= 2 && col <= BOARD_SIZE - 3) value += 1;
          // Edge bonus
          if (col === 0 || col === BOARD_SIZE - 1) value += 0.5;
          if (color === player) score += value;
          else score -= value;
        }
      }
      return score;
    }

    let bestScore = -Infinity;
    let bestMoves: typeof moves = [];
    for (const m of moves) {
      // Simulate move
      const tempBoard = board.map((r) => r.slice());
      const piece = tempBoard[m.from.row][m.from.col];
      tempBoard[m.from.row][m.from.col] = null;
      tempBoard[m.to.row][m.to.col] = piece;
      // Remove captured piece if any
      if (m.isCapture) {
        if (isKing(piece)) {
          const captured = kingCapturedPosIfCapture(
            board,
            m.from.row,
            m.from.col,
            m.to.row,
            m.to.col,
            piece,
          );
          if (captured) tempBoard[captured.row][captured.col] = null;
        } else {
          const midRow = Math.floor((m.from.row + m.to.row) / 2);
          const midCol = Math.floor((m.from.col + m.to.col) / 2);
          tempBoard[midRow][midCol] = null;
        }
      }
      // Simulate opponent's best capture
      const opp = player === "white" ? "red" : "white";
      let worstScore = Infinity;
      let opponentCanCapture = false;
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const oppPiece = tempBoard[row][col];
          if (oppPiece && getColor(oppPiece) === opp) {
            const oppMoves = getAvailableMoves(row, col, oppPiece, tempBoard);
            for (const oppMove of oppMoves) {
              let isCapture = false;
              if (isKing(oppPiece)) {
                const captured = kingCapturedPosIfCapture(
                  tempBoard,
                  row,
                  col,
                  oppMove.row,
                  oppMove.col,
                  oppPiece,
                );
                if (
                  captured &&
                  captured.row === m.to.row &&
                  captured.col === m.to.col
                ) {
                  isCapture = true;
                }
              } else {
                if (Math.abs(oppMove.row - row) === 2) {
                  const midRow = Math.floor((row + oppMove.row) / 2);
                  const midCol = Math.floor((col + oppMove.col) / 2);
                  if (midRow === m.to.row && midCol === m.to.col) {
                    isCapture = true;
                  }
                }
              }
              if (isCapture) {
                opponentCanCapture = true;
                // Simulate opponent's capture
                const tempBoard2 = tempBoard.map((r) => r.slice());
                tempBoard2[m.to.row][m.to.col] = null;
                tempBoard2[oppMove.row][oppMove.col] = oppPiece;
                if (isKing(oppPiece)) {
                  const captured = kingCapturedPosIfCapture(
                    tempBoard,
                    row,
                    col,
                    oppMove.row,
                    oppMove.col,
                    oppPiece,
                  );
                  if (captured) tempBoard2[captured.row][captured.col] = null;
                } else {
                  const midRow = Math.floor((row + oppMove.row) / 2);
                  const midCol = Math.floor((col + oppMove.col) / 2);
                  tempBoard2[midRow][midCol] = null;
                }
                const score = evaluateBoardSimple(tempBoard2, player);
                if (score < worstScore) worstScore = score;
              }
            }
          }
        }
      }
      let moveScore;
      if (opponentCanCapture) {
        moveScore = worstScore;
      } else {
        moveScore = evaluateBoardSimple(tempBoard, player);
      }
      if (moveScore > bestScore) {
        bestScore = moveScore;
        bestMoves = [m];
      } else if (moveScore === bestScore) {
        bestMoves.push(m);
      }
    }
    if (bestMoves.length > 0) {
      return Promise.resolve(
        bestMoves[Math.floor(Math.random() * bestMoves.length)],
      );
    }
    // Fallback
    return Promise.resolve(moves[Math.floor(Math.random() * moves.length)]);
  }

  if (difficulty === "hard") {
    return await new Promise((resolve) => {
      setTimeout(() => {
        const result = minimax(
          board,
          player,
          4,
          true,
          -Infinity,
          Infinity,
          player,
        );
        if (result.move) {
          resolve(result.move);
        } else {
          const captures = moves.filter((m) => m.isCapture);
          if (captures.length > 0)
            resolve(captures[Math.floor(Math.random() * captures.length)]);
          else resolve(moves[Math.floor(Math.random() * moves.length)]);
        }
      }, 0);
    });
  }

  const captures = moves.filter((m) => m.isCapture);
  if (captures.length > 0)
    return Promise.resolve(
      captures[Math.floor(Math.random() * captures.length)],
    );
  return Promise.resolve(moves[Math.floor(Math.random() * moves.length)]);
}
