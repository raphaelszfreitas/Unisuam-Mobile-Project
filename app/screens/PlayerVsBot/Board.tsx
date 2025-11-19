import React from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { BOARD_SIZE } from "./GameLogic";
import { Piece as PieceComponent } from "./Piece";
import { styles } from "./styles";
import { Piece, Position } from "./types";

interface BoardProps {
  board: Piece[][];
  onPressTile: (row: number, col: number) => void;
  selected: Position | null;
  availableMoves: Position[];
}

export const Board: React.FC<BoardProps> = ({
  board,
  onPressTile,
  selected,
  availableMoves,
}) => {
  const { width, height } = useWindowDimensions();
  // Leave some horizontal padding from screen edges
  const horizontalPadding = 32;
  // Determine the maximum available width for the board
  const maxBoardWidth = Math.min(width - horizontalPadding, height * 0.7);
  const tileSize = Math.floor(maxBoardWidth / BOARD_SIZE) || 40;
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

    return (
      <Pressable
        key={`${row}-${col}`}
        onPress={() => onPressTile(row, col)}
        style={[
          styles.tile,
          { backgroundColor, width: tileSize, height: tileSize },
        ]}
      >
        {piece && <PieceComponent piece={piece} size={tileSize} />}
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.boardContainer,
        { width: tileSize * BOARD_SIZE, height: tileSize * BOARD_SIZE },
      ]}
    >
      {board.map((rowArr, row) => (
        <View key={row} style={{ flexDirection: "row" }}>
          {rowArr.map((_, col) => renderTile(row, col))}
        </View>
      ))}
    </View>
  );
};
