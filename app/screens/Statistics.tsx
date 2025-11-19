import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { ThemedText } from "../../components/themed-text";
import { getStats, resetStats, Stats } from "../utils/stats";

type Props = {
  onClose?: () => void;
  visible?: boolean;
};

export default function Statistics({ onClose, visible = true }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const s = await getStats();
      setStats(s);
    })();
  }, []);

  const handleReset = async () => {
    await resetStats();
    const s = await getStats();
    setStats(s);
  };

  // Single modal: show loading state inside the card until stats load

  const renderMode = (key: keyof Stats, label: string) => {
    const m = (stats as any)[key];
    const winPct = m.games ? Math.round((m.wins / m.games) * 100) : 0;
    const lossPct = m.games ? Math.round((m.losses / m.games) * 100) : 0;
    const drawPct = m.games ? Math.round((m.draws / m.games) * 100) : 0;
    return (
      <View key={key} style={styles.modeBox}>
        <ThemedText style={styles.modeLabel}>{label}</ThemedText>
        <ThemedText style={styles.modeStat}>Partidas: {m.games}</ThemedText>
        <ThemedText style={styles.modeStat}>Vitórias: {m.wins}</ThemedText>
        <ThemedText style={styles.modeStat}>Derrotas: {m.losses}</ThemedText>
        <ThemedText style={styles.modeStat}>Empates: {m.draws}</ThemedText>
        <ThemedText style={styles.modeStat}>
          Taxa de vitória: {winPct}%
        </ThemedText>

        {/* Simple stacked bar: wins / losses / draws */}
        <View style={styles.chartRow}>
          <View style={styles.chartLabelRow}>
            <ThemedText style={{ color: "#1C140D" }}>Distribuição</ThemedText>
            <ThemedText style={{ color: "#1C140D" }}>
              {m.games} partidas
            </ThemedText>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, winPct)}%`,
                  backgroundColor: "#4CAF50",
                },
              ]}
            />
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, lossPct)}%`,
                  backgroundColor: "#F44336",
                  position: "absolute",
                  left: `${Math.min(100, winPct)}%`,
                },
              ]}
            />
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, drawPct)}%`,
                  backgroundColor: "#FFD54F",
                  position: "absolute",
                  left: `${Math.min(100, winPct + lossPct)}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <SafeAreaView style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          accessible={false}
        />
        <View style={[styles.card, { zIndex: 2 }]}>
          {!stats ? (
            <View style={styles.loadingContainer}>
              <ThemedText type="title" style={styles.title}>
                CARREGANDO...
              </ThemedText>
              <PrimaryButton
                title="Fechar"
                onPress={onClose}
                style={styles.resetButton}
              />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scroll}>
              <ThemedText type="title" style={styles.title}>
                ESTATÍSTICAS
              </ThemedText>
              {renderMode("easy", "Fácil")}
              {renderMode("medium", "Normal")}
              {renderMode("hard", "Difícil")}
              {renderMode("multiplayer", "Multiplayer")}

              <PrimaryButton
                title="Limpar Estatísticas"
                onPress={handleReset}
                style={styles.resetButton}
              />
              <PrimaryButton
                title="Fechar"
                onPress={onClose}
                style={[styles.resetButton, { marginTop: 8 }]}
              />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5B3A29",
    alignItems: "center",
  },
  scroll: {
    alignItems: "center",
    paddingVertical: 24,
    width: "100%",
  },
  title: {
    fontSize: 36,
    color: "#C8A24B",
    fontWeight: "bold",
    marginBottom: 20,
  },
  modeBox: {
    width: "100%",
    backgroundColor: "#FFF2CC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  modeLabel: {
    fontSize: 20,
    color: "#1C140D",
    fontWeight: "bold",
    marginBottom: 8,
  },
  modeStat: {
    fontSize: 16,
    color: "#1C140D",
    marginBottom: 4,
  },
  resetButton: {
    backgroundColor: "#C8A24B",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    width: "92%",
    maxHeight: "86%",
    backgroundColor: "#FFF2CC",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    width: "100%",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartRow: {
    width: "100%",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  chartLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  barTrack: {
    width: "100%",
    height: 18,
    backgroundColor: "#E6D9B2",
    borderRadius: 9,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#C8A24B",
  },
});
