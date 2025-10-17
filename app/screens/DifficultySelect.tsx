import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";

const DifficultySelect = ({
  onSelect,
  onBack,
}: {
  onSelect: (level: string) => void;
  onBack?: () => void;
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ThemedView
          style={styles.menuBox}
          lightColor="#5B3A29"
          darkColor="#5B3A29"
        >
          <ThemedText type="title" style={styles.title}>
            SELECIONE A DIFICULDADE
          </ThemedText>
          <PrimaryButton title="FÁCIL" onPress={() => onSelect("easy")} />
          <PrimaryButton title="NORMAL" onPress={() => onSelect("medium")} />
          <PrimaryButton title="DIFÍCIL" onPress={() => onSelect("hard")} />
          {onBack && (
            <PrimaryButton
              title="VOLTAR"
              onPress={onBack}
              style={styles.backButton}
              textStyle={styles.backButtonText}
            />
          )}
          <ThemedText style={styles.infoText}>
            (Escolha a dificuldade para jogar contra a IA)
          </ThemedText>
        </ThemedView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5B3A29",
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#C8A24B",
    marginBottom: 30,
    textAlign: "center",
    textShadowColor: "#080808",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  container: {
    flex: 1,
    backgroundColor: "#5B3A29",
    justifyContent: "center",
    alignItems: "center",
  },
  menuBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  backButton: {
    backgroundColor: "#C8A24B",
    marginTop: 24,
  },
  backButtonText: {
    color: "#5B3A29",
  },
  infoText: {
    marginTop: 2,
    color: "#C8A24B",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default DifficultySelect;
