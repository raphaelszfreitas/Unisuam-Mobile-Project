import React from "react";
import { View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { isKing } from "./GameLogic";
import { styles } from "./styles";
import { Piece as PieceType } from "./types";

interface PieceProps {
  piece: PieceType;
  size?: number;
}

export const Piece: React.FC<PieceProps> = ({ piece, size }) => {
  const { user } = useAuth() || {};
  if (!piece) return null;
  const isWhite = piece.startsWith("white");
  const king = isKing(piece);
  const userColor = (user && (user as any).pieceColor) || null;
  const background = isWhite ? "white" : userColor || "red";
  const pieceSize = size ? Math.round(size * 0.8) : 32;
  return (
    <View
      style={[
        styles.piece,
        {
          width: pieceSize,
          height: pieceSize,
          borderRadius: pieceSize / 2,
          backgroundColor: background,
          borderWidth: king ? 3 : 0,
          borderColor: king ? "#71fffa" : undefined,
        },
      ]}
    />
  );
};
