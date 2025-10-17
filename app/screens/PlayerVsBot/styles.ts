import { StyleSheet } from "react-native";

const TILE_SIZE = 40;

export const styles = StyleSheet.create({
  boardContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  piece: {
    width: TILE_SIZE * 0.8,
    height: TILE_SIZE * 0.8,
    borderRadius: TILE_SIZE * 0.4,
  },
});
