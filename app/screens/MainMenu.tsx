import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { ThemedText } from "../../components/themed-text";
import VolumeSlider from "../../components/VolumeSlider";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../context/AuthContext";
import useBackgroundMusic from "../hooks/useBackgroundMusic";
import DifficultySelect from "./DifficultySelect";
import Login from "./Login";
import PlayerVsBot from "./PlayerVsBot";
import PlayerVsPlayer from "./PlayerVsPlayer";
import Register from "./Register";
import Statistics from "./Statistics";
import UserProfile from "./UserProfile";

const MainMenu = () => {
  const { volume, setVolume } = useAudio();
  const [screen, setScreen] = useState<
    "menu" | "bot" | "pvp" | "login" | "register" | "difficulty" | "profile"
  >("menu");
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<string | null>(null);
  const { user } = useAuth();

  // background music for menu (uses global volume)
  const menuAsset = require("../../assets/audio/menu.mp3");
  useBackgroundMusic(menuAsset, screen === "menu", volume);

  if (screen === "bot") {
    return (
      <PlayerVsBot
        onBackToMenu={() => setScreen("menu")}
        difficulty={botDifficulty}
      />
    );
  }
  if (screen === "difficulty") {
    return (
      <DifficultySelect
        onSelect={(level) => {
          setBotDifficulty(level);
          setScreen("bot");
        }}
        onBack={() => setScreen("menu")}
      />
    );
  }
  if (screen === "pvp") {
    return <PlayerVsPlayer onBackToMenu={() => setScreen("menu")} />;
  }
  if (screen === "login") {
    return (
      <Login
        onRegister={() => setScreen("register")}
        onBackToMenu={() => setScreen("menu")}
      />
    );
  }
  if (screen === "register") {
    return <Register onBackToLogin={() => setScreen("login")} />;
  }
  if (screen === "profile") {
    return (
      <View style={{ flex: 1 }}>
        <UserProfile
          onBackToMenu={() => setScreen("menu")}
          onShowStats={() => setShowStatsModal(true)}
        />
        <Statistics
          visible={showStatsModal}
          onClose={() => setShowStatsModal(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.menuBox}>
        <ThemedText type="title" style={styles.title}>
          MENU PRINCIPAL
        </ThemedText>
        <PrimaryButton
          title="JOGAR vs IA"
          onPress={() => setScreen("difficulty")}
        />
        <PrimaryButton
          title="JOGADOR vs JOGADOR"
          onPress={() => setScreen("pvp")}
        />
        {user ? (
          <PrimaryButton
            title={`PERFIL (${user.name})`}
            onPress={() => setScreen("profile")}
          />
        ) : (
          <PrimaryButton
            title="LOGIN | CADASTRO"
            onPress={() => setScreen("login")}
          />
        )}
        <ThemedText style={styles.infoText}>
          (Ao se cadastrar, você poderá ter sua própria identidade, customizar
          suas peças, consultar seus rankings.)
        </ThemedText>
      </View>
      <VolumeSlider volume={volume} onChange={setVolume} />
    </View>
  );
};

const styles = StyleSheet.create({
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
  // button e buttonText agora estão em PrimaryButton.tsx
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
  // volumeBar, megaphoneIcon e slider agora estão no VolumeSlider.tsx
});

export default MainMenu;
