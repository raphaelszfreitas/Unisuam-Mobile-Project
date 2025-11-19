import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/AuthContext";
import useBackgroundMusic from "../hooks/useBackgroundMusic";
import { recordMatch } from "../utils/stats";
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

type PlayerVsPlayerProps = {
  onBackToMenu?: () => void;
};

export default function PlayerVsPlayer({ onBackToMenu }: PlayerVsPlayerProps) {
  const [board, setBoard] = useState<Piece[][]>(createInitialBoard());
  const [selected, setSelected] = useState<Position | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<"white" | "red">("red");
  const [winner, setWinner] = useState<"white" | "red" | null>(null);
  const [drawReason, setDrawReason] = useState<string | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Position[]>([]);
  const [statsRecorded, setStatsRecorded] = useState(false);
  const { user } = useAuth();
  const [userSide, setUserSide] = useState<"white" | "red" | null>(null);
  const isLoggedIn = !!user;
  const headerDisplayName = isLoggedIn ? (user as any)?.name || "Você" : null;
  const headerBadgeColor = isLoggedIn
    ? currentPlayer === userSide
      ? (user as any)?.pieceColor || (userSide === "white" ? "white" : "red")
      : currentPlayer === "white"
        ? "white"
        : "red"
    : userSide === "white"
      ? "white"
      : "red";
  const badgePulse = useRef(new Animated.Value(1)).current;
  const { width, height } = useWindowDimensions();

  // background music for PvP: play after side selection, pause on game end
  const { volume } = useAudio();
  const pvpAsset = require("../../assets/audio/pvp.mp3");
  const music = useBackgroundMusic(
    pvpAsset,
    !!userSide && !winner && !drawReason,
    volume,
  );

  const horizontalPadding = 32;
  const maxBoardWidth = Math.min(width - horizontalPadding, height * 0.7);
  const tileSize = Math.floor(maxBoardWidth / BOARD_SIZE) || 40;

  const resetGame = () => {
    setBoard(createInitialBoard());
    setSelected(null);
    setAvailableMoves([]);
    setCurrentPlayer("red");
    setWinner(null);
    setDrawReason(null);
    setStatsRecorded(false);
    // restart music when a new game begins (ensure begins from start)
    try {
      music.restart();
    } catch {
      // ignore if music unavailable
    }
  };

  const checkWinner = useCallback(
    (newBoard: Piece[][]) => {
      const whitePieces = newBoard
        .flat()
        .filter((p) => p && getColor(p) === "white");
      const redPieces = newBoard
        .flat()
        .filter((p) => p && getColor(p) === "red");
      if (whitePieces.length === 0) {
        setWinner("red");
        setSelected(null);
        setAvailableMoves([]);
      } else if (redPieces.length === 0) {
        setWinner("white");
        setSelected(null);
        setAvailableMoves([]);
      } else {
        const hasMove = () => {
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              const p = newBoard[r][c];
              if (p && getColor(p) === currentPlayer) {
                const moves = getAvailableMoves(r, c, p, newBoard);
                if (moves && moves.length > 0) return true;
              }
            }
          }
          return false;
        };
        if (!hasMove()) {
          setWinner(null);
          setDrawReason("Empate por Afogamento");
          setSelected(null);
          setAvailableMoves([]);
        }
      }
    },
    [currentPlayer],
  );

  useEffect(() => {
    if (winner) return;
    checkWinner(board);
  }, [currentPlayer, board, winner, checkWinner]);

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (!userSide) return;
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
    return () => anim && anim.stop();
  }, [badgePulse, userSide, currentPlayer]);

  useEffect(() => {
    if (statsRecorded) return;
    if (!winner && !drawReason) return;
    (async () => {
      try {
        const outcome = winner ? winner : "draw";
        await recordMatch("multiplayer", outcome);
      } catch (e) {
        console.warn("Failed to record multiplayer stats:", e);
      } finally {
        setStatsRecorded(true);
      }
    })();
  }, [winner, drawReason, statsRecorded]);

  const onPressTile = useCallback(
    (row: number, col: number) => {
      if (winner || drawReason) return;
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
            setCurrentPlayer(currentPlayer === "white" ? "red" : "white");
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
          setCurrentPlayer(currentPlayer === "white" ? "red" : "white");
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
        setCurrentPlayer(currentPlayer === "white" ? "red" : "white");
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
            setCurrentPlayer(currentPlayer === "white" ? "red" : "white");
          }
          return;
        }
      }

      setSelected(null);
      setAvailableMoves([]);
    },
    [selected, board, currentPlayer, checkWinner, winner, drawReason],
  );

  const renderTile = (row: number, col: number) => {
    const piece = board[row][col];
    const isDark = (row + col) % 2 === 1;
    const isSelected = selected && selected.row === row && selected.col === col;
    const isHighlighted = availableMoves.some(
      (m) => m.row === row && m.col === col,
    );

    let backgroundColor = isDark ? "#000000" : "#eeeed2";
    if (isSelected) backgroundColor = "#ffea00";
    else if (isHighlighted) backgroundColor = "#038703b2";

    const userColor = (user && (user as any).pieceColor) || null;
    const isWhitePiece = piece && piece.startsWith("white");
    let pieceColor: string | undefined;
    if (isWhitePiece)
      pieceColor = userSide === "white" ? userColor || "white" : "white";
    else pieceColor = userSide === "red" ? userColor || "red" : "red";

    const pieceSize = Math.round(tileSize * 0.8);

    return (
      <Pressable
        key={`${row}-${col}`}
        onPress={() => onPressTile(row, col)}
        style={[
          styles.tile,
          { backgroundColor, width: tileSize, height: tileSize },
        ]}
      >
        {piece && (
          <View
            style={{
              width: pieceSize,
              height: pieceSize,
              borderRadius: pieceSize / 2,
              backgroundColor: pieceColor,
              borderWidth: isKing(piece) ? 3 : 0,
              borderColor: isKing(piece) ? "#71fffa" : undefined,
            }}
          />
        )}
      </Pressable>
    );
  };

  const renderBoard = () => (
    <View
      style={{ width: tileSize * BOARD_SIZE, height: tileSize * BOARD_SIZE }}
    >
      {board.map((rowArr, row) => (
        <View key={row} style={{ flexDirection: "row" }}>
          {rowArr.map((_, col) => renderTile(row, col))}
        </View>
      ))}
    </View>
  );

  if (!userSide) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.sideSelectOverlay}>
          <Text style={styles.sideSelectTitle}>Escolha seu lado</Text>
          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <Pressable
              onPress={() => setUserSide("white")}
              style={({ pressed }) => [
                styles.sideButton,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.sideButtonText}>Jogar como Cima</Text>
            </Pressable>
            <Pressable
              onPress={() => setUserSide("red")}
              style={({ pressed }) => [
                styles.sideButton,
                styles.sideButtonRight,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.sideButtonText}>Jogar como Baixo</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            {currentPlayer === userSide ? (
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
                    style={[styles.opponentLabel, { marginTop: 4 }]}
                  >
                    Convidado
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
                  Oponente
                </Text>
                <View style={styles.badgeRow}>
                  <Animated.View
                    style={[
                      styles.colorSquare,
                      styles.activeColorSquare,
                      {
                        backgroundColor:
                          currentPlayer === "white" ? "white" : "red",
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
        {!winner && !drawReason && (
          <Pressable
            onPress={() => {
              const opponent: "white" | "red" =
                currentPlayer === "white" ? "red" : "white";
              setWinner(opponent);
              setDrawReason(null);
              setStatsRecorded(false);
            }}
            style={({ pressed }) => [
              styles.forfeitButton,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.forfeitText}>Desistir</Text>
          </Pressable>
        )}
      </View>

      {(winner || drawReason) && (
        <>
          {winner &&
            (winner === userSide ? (
              <View style={styles.victoryRow}>
                <Text style={styles.victoryText}>
                  Vitória de{" "}
                  {isLoggedIn ? (user as any).name || "Você" : "Convidado"}!
                </Text>
                <View
                  style={[
                    styles.colorPreview,
                    {
                      backgroundColor: isLoggedIn
                        ? (user as any).pieceColor ||
                          (userSide === "white" ? "white" : "red")
                        : userSide === "white"
                          ? "white"
                          : "red",
                    },
                  ]}
                />
              </View>
            ) : (
              <View style={styles.victoryRow}>
                <Text style={styles.victoryText}>Vitória do Oponente!</Text>
                <View
                  style={[
                    styles.colorPreview,
                    { backgroundColor: winner === "white" ? "white" : "red" },
                  ]}
                />
              </View>
            ))}

          {drawReason && (
            <Text style={[styles.victoryText, { color: "orange" }]}>
              {drawReason}
            </Text>
          )}

          {onBackToMenu && (
            <Pressable onPress={onBackToMenu} style={styles.resetButton}>
              <Text style={styles.resetText}>Voltar ao Menu Principal</Text>
            </Pressable>
          )}
        </>
      )}

      {(winner || drawReason) && (
        <Pressable onPress={resetGame} style={styles.resetButton}>
          <Text style={styles.resetText}>Reiniciar Partida</Text>
        </Pressable>
      )}

      {renderBoard()}
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
  tile: { justifyContent: "center", alignItems: "center" },
  turnText: { fontSize: 20, color: "white", marginBottom: 10 },
  resetButton: {
    backgroundColor: "#8b8b8b",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 10,
    alignSelf: "center",
    minWidth: 180,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  resetText: { color: "white", fontSize: 16, fontWeight: "bold" },
  sideSelectOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  sideSelectTitle: { fontSize: 22, color: "#FFF2CC", fontWeight: "bold" },
  sideButton: {
    backgroundColor: "#FFF2CC",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  sideButtonRight: { backgroundColor: "#C8A24B" },
  sideButtonText: { color: "#5B3A29", fontWeight: "bold" },
  playerLabel: { fontSize: 18, color: "#FFF2CC", fontWeight: "700" },
  opponentLabel: {
    fontSize: 18,
    color: "#FFF2CC",
    fontWeight: "700",
    opacity: 0.95,
  },
  activeLabel: { fontWeight: "900" },
  playerBlock: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 6,
    borderRadius: 8,
  },
  activePlayerBlock: { backgroundColor: "rgba(255,242,204,0.08)" },
  colorSquare: { width: 16, height: 16, borderRadius: 4, marginLeft: 8 },
  activeColorSquare: { borderWidth: 2, borderColor: "#FFF2CC" },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
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
  colorPreview: { width: 14, height: 14, borderRadius: 4, marginLeft: 8 },
  forfeitButton: {
    backgroundColor: "#b23b3b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  forfeitText: { color: "white", fontWeight: "700" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "92%",
    marginBottom: 10,
  },
  playerColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
    flexShrink: 1,
    marginLeft: 8,
  },
});
