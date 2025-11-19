// index.tsx

import React, { useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/AuthContext";
import useBackgroundMusic from "../hooks/useBackgroundMusic";
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
  const [statsRecorded, setStatsRecorded] = useState(false);
  const { user } = useAuth();
  const badgePulse = React.useRef(new Animated.Value(1)).current;

  const isLoggedIn = !!user;
  const headerDisplayName = isLoggedIn
    ? (user as any)?.name || "Jogador"
    : null;
  const headerBadgeColor = isLoggedIn
    ? currentPlayer === "red"
      ? (user as any)?.pieceColor || "red"
      : currentPlayer === "white"
        ? "white"
        : "red"
    : "red";

  // background music per difficulty
  const easyAsset = require("../../assets/audio/easy.mp3");
  const mediunAsset = require("../../assets/audio/mediun.mp3");
  const hardAsset = require("../../assets/audio/hard.mp3");
  const selectedAsset =
    difficulty === "easy"
      ? easyAsset
      : difficulty === "hard"
        ? hardAsset
        : mediunAsset; // default to mediun for 'medium'
  const { volume } = useAudio();
  const active = !!difficulty && !winner && !drawReason;
  const music = useBackgroundMusic(selectedAsset, active, volume);

  // Debug/logging + fallback control: ensure play/pause is triggered
  React.useEffect(() => {
    try {
      console.log("PlayerVsBot audio ->", { selectedAsset, active });
      if (active) {
        // best-effort: call play in case the hook didn't start automatically
        music.play?.();
      } else {
        music.pause?.();
      }
    } catch (e) {
      console.warn("PlayerVsBot music control failed:", e);
    }
  }, [active, selectedAsset, music]);

  // Garante que ao trocar a dificuldade, o jogo reinicia
  React.useEffect(() => {
    setBoard(createInitialBoard());
    setSelected(null);
    setAvailableMoves([]);
    setCurrentPlayer("red");
    setWinner(null);
    setDrawReason(null);
    // restart music when difficulty changes
    try {
      music?.restart?.();
    } catch {
      /* ignore */
    }
  }, [difficulty, music]);
  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelected(null);
    setAvailableMoves([]);
    setCurrentPlayer("red");
    setWinner(null);
    setDrawReason(null);
    setStatsRecorded(false);
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

  // Record stats when a match ends (winner or draw). Only once per match.
  React.useEffect(() => {
    if (statsRecorded) return;
    if (!winner && !drawReason) return;
    (async () => {
      try {
        const { recordMatch } = await import("../utils/stats");
        const mode =
          difficulty === "easy" ||
          difficulty === "medium" ||
          difficulty === "hard"
            ? (difficulty as any)
            : "easy";
        if (winner) {
          // human is 'red'
          await recordMatch(mode, winner, { humanIs: "red" });
        } else if (drawReason) {
          await recordMatch(mode, "draw");
        }
      } catch (e) {
        console.warn("Failed to record stats:", e);
      } finally {
        setStatsRecorded(true);
      }
    })();
  }, [winner, drawReason, statsRecorded, difficulty]);

  React.useEffect(() => {
    if (currentPlayer !== "white" || winner) return;

    // small delay so the bot move feels natural and UI updates are visible
    const id = setTimeout(() => {
      (async () => {
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
      })();
    }, 240);

    return () => clearTimeout(id);
  }, [currentPlayer, board, winner, difficulty, checkWinner]);

  // pulse animation for active badge / color square
  React.useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    // animate when either red (player) or white (bot) is active
    if (currentPlayer === "red" || currentPlayer === "white") {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulse, {
            toValue: 1.12,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(badgePulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ]),
      );
      anim.start();
    } else {
      badgePulse.setValue(1);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [currentPlayer, badgePulse]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Text style={styles.turnText}>Turno:</Text>
          <View
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              marginLeft: 8,
              flexShrink: 1,
            }}
          >
            {currentPlayer === "red" ? (
              <View style={[styles.playerBlock, styles.activePlayerBlock]}>
                {headerDisplayName ? (
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.playerLabel, styles.activeLabel]}
                  >
                    {headerDisplayName}
                  </Text>
                ) : (
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.playerLabel, { marginTop: 4 }]}
                  >
                    Vermelho
                  </Text>
                )}
                <View style={styles.badgeRow}>
                  <Animated.View
                    style={[
                      styles.colorSquare,
                      styles.activeColorSquare,
                      {
                        backgroundColor: headerBadgeColor,
                        transform: [{ scale: badgePulse }],
                      },
                    ]}
                  />
                  <Animated.Text
                    style={[
                      styles.turnBadge,
                      { transform: [{ scale: badgePulse }] },
                    ]}
                  >
                    Seu turno
                  </Animated.Text>
                </View>
              </View>
            ) : (
              <View style={[styles.playerBlock, styles.activePlayerBlock]}>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.opponentLabel, styles.activeLabel]}
                >
                  Brancas
                </Text>
                <View style={styles.badgeRow}>
                  <Animated.View
                    style={[
                      styles.colorSquare,
                      styles.activeColorSquare,
                      {
                        backgroundColor: "white",
                        transform: [{ scale: badgePulse }],
                      },
                    ]}
                  />
                  <Animated.Text
                    style={[
                      styles.turnBadge,
                      { transform: [{ scale: badgePulse }] },
                    ]}
                  >
                    Turno
                  </Animated.Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Back button moved below header to keep a single control in a fixed position above the board */}
      </View>

      {(winner || drawReason) && (
        <>
          {winner ? (
            winner === "white" ? (
              <Text style={styles.victoryText}>Vitória das Brancas ⚪!</Text>
            ) : user ? (
              <View style={styles.victoryRow}>
                <Text style={styles.victoryText}>
                  Vitória de {(user as any).name || "Jogador"}!
                </Text>
                <View
                  style={[
                    styles.colorSquare,
                    {
                      backgroundColor: (user as any).pieceColor || "red",
                      marginLeft: 8,
                    },
                  ]}
                />
              </View>
            ) : (
              <Text style={styles.victoryText}>Vitória das Vermelhas 🔴!</Text>
            )
          ) : null}

          {drawReason && (
            <Text style={{ fontSize: 24, color: "orange", marginBottom: 10 }}>
              {drawReason}
            </Text>
          )}

          {/* Back-to-menu button moved to header so it's available during the match.
                The victory area keeps only the victory message and restart control. */}
        </>
      )}
      {/* Single centered back button (visible during the match and also when victorious) */}
      {onBackToMenu && (
        <Pressable
          onPress={onBackToMenu}
          style={({ pressed }) => [
            styles.centeredHeaderButton,
            pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 },
          ]}
        >
          <Text style={styles.resetText}>Voltar ao Menu Principal</Text>
        </Pressable>
      )}

      {(winner || drawReason) && (
        <>
          <Pressable
            onPress={resetGame}
            style={({ pressed }) => [
              styles.resetButton,
              pressed && {
                backgroundColor: "#efefef",
                transform: [{ scale: 1.03 }],
                opacity: 0.9,
              },
            ]}
          >
            <Text style={styles.resetText}>Reiniciar Partida</Text>
          </Pressable>
        </>
      )}

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
    alignItems: "center",
    justifyContent: "center",
  },
  headerResetButton: {
    backgroundColor: "#8b8b8b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 160,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    flexShrink: 1,
  },
  centeredHeaderButton: {
    alignSelf: "center",
    backgroundColor: "#8b8b8b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
    maxWidth: "85%",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
  },
  resetText: { color: "white", fontSize: 16, fontWeight: "bold" },
  nameText: {
    fontSize: 20,
    color: "#FFF2CC",
    fontWeight: "700",
    marginLeft: 8,
  },
  playerLabel: {
    fontSize: 18,
    color: "#FFF2CC",
    fontWeight: "700",
    marginLeft: 0,
  },
  opponentLabel: {
    fontSize: 18,
    color: "#FFF2CC",
    fontWeight: "700",
    marginLeft: 0,
    opacity: 0.95,
  },
  activeLabel: {
    fontWeight: "900",
  },
  playerBlock: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 6,
    borderRadius: 8,
  },
  activePlayerBlock: {
    backgroundColor: "rgba(255,242,204,0.08)",
  },
  colorSquare: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginLeft: 0,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  activeColorSquare: {
    borderWidth: 2,
    borderColor: "#FFF2CC",
  },
  colorPreview: { width: 14, height: 14, borderRadius: 4, marginLeft: 8 },
  turnBadge: {
    marginLeft: 8,
    fontSize: 12,
    color: "#FFF2CC",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  victoryText: {
    fontSize: 24,
    color: "gold",
    marginBottom: 10,
    textAlign: "center",
  },
  victoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  headerRow: {
    width: "100%",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  topButton: {
    backgroundColor: "#6b6b6b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  topButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});
