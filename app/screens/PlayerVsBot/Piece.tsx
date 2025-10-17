import React from "react";
import { View } from "react-native";
import { isKing } from "./GameLogic";
import { styles } from "./styles";
import { Piece as PieceType } from "./types";

interface PieceProps {
  piece: PieceType;
}

export const Piece: React.FC<PieceProps> = ({ piece }) => {
  if (!piece) return null;
  const isWhite = piece.startsWith("white");
  const king = isKing(piece);
  return (
    <View
      style={[
        styles.piece,
        {
          backgroundColor: isWhite ? "white" : "red",
          borderWidth: king ? 3 : 0,
          borderColor: king ? "#71fffa" : undefined,
        },
      ]}
    />
  );
};
