import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  boardContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  tile: {
    justifyContent: "center",
    alignItems: "center",
  },
  piece: {
    // dynamic sizing handled by Piece component via inline styles
  },
});
