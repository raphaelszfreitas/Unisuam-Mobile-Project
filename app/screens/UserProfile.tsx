import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";
import ThemedInput from "../../components/ThemedInput";

import { useAuth } from "../context/AuthContext";
import Statistics from "./Statistics";

const COLORS = [
  // Brancos e beges
  "#F5F5F5", // branco
  "#A1887F", // bege
  // Amarelos
  "#FFEB3B", // amarelo claro
  "#FFD54F", // amarelo
  "#FBC02D", // amarelo ouro
  "#C8A24B", // dourado
  // Verdes claros
  "#CDDC39", // verde limão claro
  "#81C784", // verde claro
  "#00E676", // verde limão
  // Verdes médios e escuros
  "#4CAF50", // verde escuro
  "#388E3C", // verde folha
  // Azuis claros e ciano
  "#64B5F6", // azul claro
  "#00BCD4", // ciano
  "#009688", // teal
  // Azuis médios e escuros
  "#3F51B5", // azul médio
  "#1A237E", // azul escuro
  // Roxos
  "#BA68C8", // roxo
  "#D500F9", // roxo vibrante
  // Rosas e magenta
  "#F06292", // rosa
  "#C51162", // magenta
  // Vermelhos
  "#E57373", // vermelho
  "#F44336", // vermelho vivo
  "#B71C1C", // vermelho escuro
  // Laranjas
  "#FF9800", // laranja
  "#FF5722", // laranja queimado
  // Marrons
  "#8D6E63", // marrom
  "#6D4C41", // marrom escuro
  // Cinzas
  "#90A4AE", // cinza claro
  "#607D8B", // cinza azulado
  // Preto
  "#333333", // preto
];

type Props = {
  onBackToMenu?: () => void;
  onShowStats?: () => void;
};

const UserProfile = ({ onBackToMenu, onShowStats }: Props) => {
  const { user, login, logout } = useAuth();
  const [nickname, setNickname] = useState(user?.name || "");
  const [selectedColor, setSelectedColor] = useState(() => {
    if (user && (user as any).pieceColor) return (user as any).pieceColor;
    return COLORS[0];
  });
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        PERFIL DO USUÁRIO
      </ThemedText>

      <ThemedText style={styles.label}>Apelido:</ThemedText>
      <ThemedInput
        style={styles.nicknameInput}
        value={nickname}
        onChangeText={setNickname}
        placeholder="Digite seu apelido"
        placeholderTextColor="#1C140D"
      />

      <ThemedText style={styles.label}>Cor da peça:</ThemedText>
      <Pressable
        style={[styles.colorSquare, { backgroundColor: selectedColor }]}
        onPress={() => setColorModalVisible(true)}
      />

      <Modal
        visible={colorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setColorModalVisible(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Selecione uma cor</ThemedText>
            <ThemedView style={styles.paletteModal}>
              {COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: color,
                      borderWidth: selectedColor === color ? 3 : 1,
                      borderColor: selectedColor === color ? "#FFF2CC" : "#888",
                    },
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    setColorModalVisible(false);
                  }}
                />
              ))}
            </ThemedView>
            <PrimaryButton
              title="Cancelar"
              onPress={() => setColorModalVisible(false)}
              style={styles.closeModalBtn}
              textStyle={styles.closeModalText}
            />
          </ThemedView>
        </ThemedView>
      </Modal>

      <PrimaryButton
        title="Salvar Alterações"
        onPress={async () => {
          if (!user) return;
          try {
            // Atualiza usuário no AsyncStorage (tanto no contexto quanto na lista de usuários)
            // Atualiza lista de usuários
            const usersRaw = await AsyncStorage.getItem("users");
            let users = usersRaw ? JSON.parse(usersRaw) : [];
            users = users.map((u: any) =>
              u.email === user.email
                ? { ...u, name: nickname, pieceColor: selectedColor }
                : u,
            );
            await AsyncStorage.setItem("users", JSON.stringify(users));
            // Atualiza usuário logado
            const updatedUser = {
              ...user,
              name: nickname,
              pieceColor: selectedColor,
            };
            await AsyncStorage.setItem(
              "loggedUser",
              JSON.stringify(updatedUser),
            );
            login(updatedUser);
            setMessage("Alterações salvas com sucesso!");
            setTimeout(() => setMessage(null), 2000);
          } catch {
            setMessage("Erro ao salvar alterações.");
            setTimeout(() => setMessage(null), 2000);
          }
        }}
        style={styles.primaryButton}
        textStyle={styles.primaryButtonText}
      />

      {message && (
        <ThemedText
          style={{ color: "#4BB543", fontWeight: "bold", marginTop: 8 }}
        >
          {message}
        </ThemedText>
      )}

      <PrimaryButton
        title="Ver Estatísticas"
        onPress={() => {
          setStatisticsModalVisible(true);
        }}
        style={styles.primaryButton}
        textStyle={styles.primaryButtonText}
      />

      <Statistics
        visible={statisticsModalVisible}
        onClose={() => setStatisticsModalVisible(false)}
      />

      <PrimaryButton
        title="Logout"
        onPress={() => {
          logout();
          if (onBackToMenu) onBackToMenu();
        }}
        style={[styles.primaryButton, { backgroundColor: "#ff4040" }]}
        textStyle={[styles.primaryButtonText, { color: "#fff" }]}
      />

      {onBackToMenu && (
        <PrimaryButton
          title="Voltar ao Menu"
          onPress={onBackToMenu}
          style={[
            styles.primaryButton,
            { backgroundColor: "#C8A24B", marginTop: 24 },
          ]}
          textStyle={[styles.primaryButtonText, { color: "#5B3A29" }]}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5B3A29",
  },
  title: {
    fontSize: 38,
    color: "#C8A24B",
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    textShadowColor: "#080808",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  label: {
    color: "#C8A24B",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    // ThemedInput already styled
  },
  palette: {
    flexDirection: "row",
    marginVertical: 12,
  },
  colorSquare: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 3,
    borderColor: "#FFF2CC",
    alignSelf: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF2CC",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    minWidth: 260,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5B3A29",
    marginBottom: 16,
  },
  paletteModal: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
  },
  closeModalBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: "#C8A24B",
    borderRadius: 16,
  },
  closeModalText: {
    color: "#5B3A29",
    fontWeight: "bold",
    fontSize: 16,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
    marginVertical: 6,
  },
  primaryButton: {
    backgroundColor: "#FFF2CC",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#1C140D",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  nicknameInput: {
    backgroundColor: "#FFF2CC",
    borderColor: "#C8A24B",
    borderWidth: 2,
    color: "#1C140D",
    fontWeight: "bold",
    width: 260,
    height: 60,
    borderRadius: 30,
    marginVertical: 12,
    paddingHorizontal: 24,
    fontSize: 18,
    textAlign: "center",
  },
});

export default UserProfile;
