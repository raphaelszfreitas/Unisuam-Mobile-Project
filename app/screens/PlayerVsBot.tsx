// index.tsx

import React, { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text } from "react-native";
import { Board } from "./PlayerVsBot/Board";
import { chooseBotMove } from "./PlayerVsBot/BotLogic";
import {
  BOARD_SIZE,
  createInitialBoard,
  getAvailableMoves,
  getColor,
  hasAnotherCapture,
  isKing,
  isPathClear,
  kingCapturedPosIfCapture,
} from "./PlayerVsBot/GameLogic";
import { Piece, Position } from "./PlayerVsBot/types";

type PlayerVsBotProps = {
  onBackToMenu?: () => void;
  difficulty?: string | null;
};

export default function PlayerVsBot({
  onBackToMenu,
  difficulty = "easy",
}: PlayerVsBotProps) {
  const [board, setBoard] = useState<Piece[][]>(createInitialBoard());
  const [selected, setSelected] = useState<Position | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<"white" | "red">("red");
  const [winner, setWinner] = useState<"white" | "red" | null>(null);
  const [drawReason, setDrawReason] = useState<string | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Position[]>([]);

  // Garante que ao trocar a dificuldade, o jogo reinicia
  React.useEffect(() => {
    setBoard(createInitialBoard());
    setSelected(null);
    setAvailableMoves([]);
    setCurrentPlayer("red");
    setWinner(null);
    setDrawReason(null);
  }, [difficulty]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelected(null);
    setAvailableMoves([]);
    setCurrentPlayer("red");
    setWinner(null);
    setDrawReason(null);
  };

  const checkWinner = React.useCallback(
    (newBoard: Piece[][]) => {
      const whitePieces = newBoard
        .flat()
        .filter((p) => p && getColor(p) === "white");
      const redPieces = newBoard
        .flat()
        .filter((p) => p && getColor(p) === "red");
      if (whitePieces.length === 0) setWinner("red");
      else if (redPieces.length === 0) setWinner("white");
      else {
        // Verifica se o jogador atual está bloqueado (sem movimentos válidos)
        const hasMove = () => {
          for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
              const piece = newBoard[row][col];
              if (piece && getColor(piece) === currentPlayer) {
                const moves = getAvailableMoves(row, col, piece, newBoard);
                if (moves.length > 0) return true;
              }
            }
          }
          return false;
        };
        if (!hasMove()) {
          // Empate por afogamento
          setWinner(null);
          setDrawReason("Empate por afogamento!");
        }
      }
    },
    [currentPlayer],
  );

  const onPressTile = React.useCallback(
    (row: number, col: number) => {
      // Bloqueia qualquer interação do usuário quando não for o turno das vermelhas
      if (currentPlayer !== "red") return;

      const sel = selected;
      const selPiece = sel ? board[sel.row][sel.col] : null;
      const clicked = board[row][col];

      if (!sel) {
        if (clicked && getColor(clicked) === currentPlayer) {
          setSelected({ row, col });
          setAvailableMoves(getAvailableMoves(row, col, clicked, board));
        }
        return;
      }

      if (clicked && getColor(clicked) === currentPlayer) {
        setSelected({ row, col });
        setAvailableMoves(getAvailableMoves(row, col, clicked, board));
        return;
      }

      if (!selPiece) {
        setSelected(null);
        setAvailableMoves([]);
        return;
      }

      const isDark = (row + col) % 2 === 1;
      if (!isDark || board[row][col] !== null) {
        setSelected(null);
        setAvailableMoves([]);
        return;
      }

      const rowDiff = row - sel.row;
      const colDiff = col - sel.col;

      if (isKing(selPiece)) {
        const captured = kingCapturedPosIfCapture(
          board,
          sel.row,
          sel.col,
          row,
          col,
          selPiece,
        );
        if (captured) {
          const newBoard = board.map((r) => r.slice());
          newBoard[row][col] = selPiece;
          newBoard[sel.row][sel.col] = null;
          newBoard[captured.row][captured.col] = null;
          setBoard(newBoard);
          checkWinner(newBoard);

          if (hasAnotherCapture(newBoard, row, col, selPiece)) {
            setSelected({ row, col });
            setAvailableMoves(getAvailableMoves(row, col, selPiece, newBoard));
          } else {
            setSelected(null);
            setAvailableMoves([]);
            setCurrentPlayer((prev) => (prev === "white" ? "red" : "white"));
          }
          return;
        }

        if (
          Math.abs(rowDiff) === Math.abs(colDiff) &&
          isPathClear(board, sel.row, sel.col, row, col)
        ) {
          const newBoard = board.map((r) => r.slice());
          newBoard[row][col] = selPiece;
          newBoard[sel.row][sel.col] = null;
          setBoard(newBoard);
          checkWinner(newBoard);
          setSelected(null);
          setAvailableMoves([]);
          setCurrentPlayer((prev) => (prev === "white" ? "red" : "white"));
          return;
        }

        setSelected(null);
        setAvailableMoves([]);
        return;
      }

      const forward = selPiece === "white" ? 1 : -1;

      if (rowDiff === forward && Math.abs(colDiff) === 1) {
        const newBoard = board.map((r) => r.slice());
        let placed: Piece = selPiece;
        if (selPiece === "white" && row === BOARD_SIZE - 1)
          placed = "whiteKing";
        else if (selPiece === "red" && row === 0) placed = "redKing";

        newBoard[row][col] = placed;
        newBoard[sel.row][sel.col] = null;
        setBoard(newBoard);
        checkWinner(newBoard);

        setSelected(null);
        setAvailableMoves([]);
        setCurrentPlayer((prev) => (prev === "white" ? "red" : "white"));
        return;
      }

      if (rowDiff === forward * 2 && Math.abs(colDiff) === 2) {
        const midRow = Math.floor((row + sel.row) / 2);
        const midCol = Math.floor((col + sel.col) / 2);
        const midPiece = board[midRow][midCol];
        if (midPiece && getColor(midPiece) !== getColor(selPiece)) {
          const newBoard = board.map((r) => r.slice());
          let placed: Piece = selPiece;
          if (selPiece === "white" && row === BOARD_SIZE - 1)
            placed = "whiteKing";
          else if (selPiece === "red" && row === 0) placed = "redKing";

          newBoard[row][col] = placed;
          newBoard[sel.row][sel.col] = null;
          newBoard[midRow][midCol] = null;
          setBoard(newBoard);
          checkWinner(newBoard);

          if (hasAnotherCapture(newBoard, row, col, placed)) {
            setSelected({ row, col });
            setAvailableMoves(getAvailableMoves(row, col, placed, newBoard));
          } else {
            setSelected(null);
            setAvailableMoves([]);
            setCurrentPlayer((prev) => (prev === "white" ? "red" : "white"));
          }
          return;
        }
      }

      setSelected(null);
      setAvailableMoves([]);
    },
    [selected, board, currentPlayer, checkWinner],
  );

  // Checa empate por afogamento sempre que o turno muda
  React.useEffect(() => {
    if (winner) return;
    checkWinner(board);
  }, [currentPlayer, board, winner, checkWinner]);

  React.useEffect(() => {
    if (currentPlayer !== "white" || winner) return;

    const id = setTimeout(async () => {
      const move = await chooseBotMove(board, "white", difficulty ?? "easy");
      if (!move) return;

      const { from, to } = move;
      const selPiece = board[from.row][from.col];
      if (!selPiece) return;

      // Lógica de movimentação igual ao onPressTile, mas sem bloqueio de turno
      const rowDiff = to.row - from.row;
      const colDiff = to.col - from.col;

      if (isKing(selPiece)) {
        const captured = kingCapturedPosIfCapture(
          board,
          from.row,
          from.col,
          to.row,
          to.col,
          selPiece,
        );
        if (captured) {
          const newBoard = board.map((r) => r.slice());
          newBoard[to.row][to.col] = selPiece;
          newBoard[from.row][from.col] = null;
          newBoard[captured.row][captured.col] = null;
          setBoard(newBoard);
          checkWinner(newBoard);

          if (hasAnotherCapture(newBoard, to.row, to.col, selPiece)) {
            setSelected({ row: to.row, col: to.col });
            setAvailableMoves(
              getAvailableMoves(to.row, to.col, selPiece, newBoard),
            );
          } else {
            setSelected(null);
            setAvailableMoves([]);
            setCurrentPlayer("red");
          }
          return;
        }

        if (
          Math.abs(rowDiff) === Math.abs(colDiff) &&
          isPathClear(board, from.row, from.col, to.row, to.col)
        ) {
          const newBoard = board.map((r) => r.slice());
          newBoard[to.row][to.col] = selPiece;
          newBoard[from.row][from.col] = null;
          setBoard(newBoard);
          checkWinner(newBoard);
          setSelected(null);
          setAvailableMoves([]);
          setCurrentPlayer("red");
          return;
        }
        setSelected(null);
        setAvailableMoves([]);
        return;
      }

      const forward = selPiece === "white" ? 1 : -1;

      if (rowDiff === forward && Math.abs(colDiff) === 1) {
        const newBoard = board.map((r) => r.slice());
        let placed: Piece = selPiece;
        if (selPiece === "white" && to.row === BOARD_SIZE - 1)
          placed = "whiteKing";
        else if (selPiece === "red" && to.row === 0) placed = "redKing";

        newBoard[to.row][to.col] = placed;
        newBoard[from.row][from.col] = null;
        setBoard(newBoard);
        checkWinner(newBoard);
        setSelected(null);
        setAvailableMoves([]);
        setCurrentPlayer("red");
        return;
      }

      if (rowDiff === forward * 2 && Math.abs(colDiff) === 2) {
        const midRow = Math.floor((to.row + from.row) / 2);
        const midCol = Math.floor((to.col + from.col) / 2);
        const midPiece = board[midRow][midCol];
        if (midPiece && getColor(midPiece) !== getColor(selPiece)) {
          const newBoard = board.map((r) => r.slice());
          let placed: Piece = selPiece;
          if (selPiece === "white" && to.row === BOARD_SIZE - 1)
            placed = "whiteKing";
          else if (selPiece === "red" && to.row === 0) placed = "redKing";

          newBoard[to.row][to.col] = placed;
          newBoard[from.row][from.col] = null;
          newBoard[midRow][midCol] = null;
          setBoard(newBoard);
          checkWinner(newBoard);

          if (hasAnotherCapture(newBoard, to.row, to.col, placed)) {
            setSelected({ row: to.row, col: to.col });
            setAvailableMoves(
              getAvailableMoves(to.row, to.col, placed, newBoard),
            );
          } else {
            setSelected(null);
            setAvailableMoves([]);
            setCurrentPlayer("red");
          }
          return;
        }
      }

      setSelected(null);
      setAvailableMoves([]);
    }, 500);
    return () => clearTimeout(id);
  }, [currentPlayer, board, winner, difficulty, checkWinner]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.turnText}>
        Turno: {currentPlayer === "white" ? "Brancas ⚪" : "Vermelhas 🔴"}
      </Text>
      {(winner || drawReason) && (
        <>
          {winner && (
            <Text
              style={{
                fontSize: 24,
                color: "gold",
                marginBottom: 10,
              }}
            >
              Vitória das {winner === "white" ? "Brancas ⚪" : "Vermelhas 🔴"}!
            </Text>
          )}
          {drawReason && (
            <Text
              style={{
                fontSize: 24,
                color: "orange",
                marginBottom: 10,
              }}
            >
              {drawReason}
            </Text>
          )}
          {onBackToMenu && (
            <Pressable
              onPress={onBackToMenu}
              style={({ pressed }) => [
                styles.resetButton,
                pressed && {
                  backgroundColor: "#efefef",
                  transform: [{ scale: 1.05 }],
                  opacity: 0.8,
                },
              ]}
            >
              <Text style={styles.resetText}>Voltar ao Menu Principal</Text>
            </Pressable>
          )}
        </>
      )}
      <Pressable
        onPress={resetGame}
        style={({ pressed }) => [
          styles.resetButton,
          pressed && {
            backgroundColor: "#efefef",
            transform: [{ scale: 1.05 }],
            opacity: 0.8,
          },
        ]}
      >
        <Text style={styles.resetText}>Reiniciar Partida</Text>
      </Pressable>
      <Board
        board={board}
        onPressTile={onPressTile}
        selected={selected}
        availableMoves={availableMoves}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  turnText: { fontSize: 20, color: "white", marginBottom: 10 },
  resetButton: {
    backgroundColor: "#8b8b8b",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  resetText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
