import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { Colors } from "../constants/theme";

const ThemedInput: React.FC<TextInputProps> = (props) => {
  return (
    <TextInput
      style={[styles.input, props.style]}
      placeholderTextColor="#1C140D"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.light.background,
    height: 60,
    width: 260,
    borderRadius: 30,
    marginVertical: 12,
    paddingHorizontal: 24,
    fontSize: 18,
    color: Colors.light.text,
    fontWeight: "bold",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default ThemedInput;
