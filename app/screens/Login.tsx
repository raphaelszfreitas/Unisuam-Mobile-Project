import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { ThemedText } from "../../components/themed-text";
import ThemedInput from "../../components/ThemedInput";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../utils/userStorage";

const Login = ({
  onRegister,
  onBackToMenu,
}: {
  onRegister?: () => void;
  onBackToMenu?: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirectTimeout, setRedirectTimeout] = useState<number | null>(null);
  const { user, login } = useAuth();

  React.useEffect(() => {
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [redirectTimeout]);

  React.useEffect(() => {
    if (user && onBackToMenu) {
      onBackToMenu();
    }
    // eslint-disable-next-line
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.menuBox}>
        <ThemedText type="title" style={styles.title}>
          LOGIN
        </ThemedText>
        <ThemedInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <ThemedInput
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <ThemedText style={styles.forgotText}>Esqueci minha senha</ThemedText>
        <PrimaryButton
          title="ENTRAR"
          onPress={async () => {
            setMessage(null);
            setSuccess(false);
            if (!email || !password) {
              setMessage("Preencha todos os campos.");
              return;
            }
            const result = await loginUser(email, password);
            if (result.success && result.user) {
              setSuccess(true);
              setMessage(
                "Login realizado com sucesso! Redirecionando para o menu...",
              );
              login({ name: result.user.name, email: result.user.email });
              if (redirectTimeout) clearTimeout(redirectTimeout);
              const timeout = window.setTimeout(() => {
                if (onBackToMenu) onBackToMenu();
              }, 1500);
              setRedirectTimeout(timeout);
            } else {
              setMessage(result.error || "E-mail ou senha inválidos.");
            }
          }}
        />
        {message && (
          <ThemedText
            style={{
              color: success ? "#4BB543" : "#C00",
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            {message}
          </ThemedText>
        )}
        <ThemedText style={styles.infoText}>Não possui uma conta?</ThemedText>
        <PrimaryButton title="CADASTRE-SE" onPress={onRegister} />
        {onBackToMenu && (
          <PrimaryButton
            title="VOLTAR AO MENU"
            onPress={onBackToMenu}
            style={{ backgroundColor: "#C8A24B", marginTop: 24 }}
            textStyle={{ color: "#5B3A29" }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // forgotText já está definido acima, removido duplicado
  container: {
    flex: 1,
    backgroundColor: "#5B3A29",
    justifyContent: "center",
    alignItems: "center",
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
  menuBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  input: {
    backgroundColor: "#FFF2CC",
    height: 60,
    width: 260,
    borderRadius: 30,
    marginVertical: 12,
    paddingHorizontal: 24,
    fontSize: 18,
    color: "#1C140D",
    fontWeight: "bold",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  // button e buttonText agora estão em PrimaryButton.tsx
  forgotText: {
    color: "#C8A24B",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    marginTop: -8,
    textDecorationLine: "underline",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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

export default Login;
