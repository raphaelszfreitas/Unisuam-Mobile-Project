import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  textStyle?: object;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  style,
  textStyle,
  ...props
}) => (
  <TouchableOpacity style={[styles.button, style]} {...props}>
    <Text style={[styles.buttonText, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FFF2CC",
    height: 60,
    width: 260,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    marginVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: "#1C140D",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default PrimaryButton;
