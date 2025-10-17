import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { ThemedText } from "../../components/themed-text";
import ThemedInput from "../../components/ThemedInput";
import { saveUser } from "../utils/userStorage";

const Register = ({ onBackToLogin }: { onBackToLogin?: () => void }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirectTimeout, setRedirectTimeout] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [redirectTimeout]);

  return (
    <View style={styles.container}>
      <View style={styles.menuBox}>
        <ThemedText type="title" style={styles.title}>
          CADASTRO
        </ThemedText>
        <ThemedInput placeholder="Nome" value={name} onChangeText={setName} />
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
        <ThemedInput
          placeholder="Repetir Senha"
          value={repeatPassword}
          onChangeText={setRepeatPassword}
          secureTextEntry
        />
        <PrimaryButton
          title={isSubmitting ? "Aguarde..." : "CONFIRMAR"}
          disabled={isSubmitting}
          onPress={async () => {
            setMessage(null);
            setSuccess(false);
            setIsSubmitting(true);
            if (!name || !email || !password || !repeatPassword) {
              setMessage("Preencha todos os campos.");
              setIsSubmitting(false);
              return;
            }
            if (password !== repeatPassword) {
              setMessage("As senhas não coincidem.");
              setIsSubmitting(false);
              return;
            }
            const result = await saveUser({ name, email, password });
            if (result.success) {
              setSuccess(true);
              setMessage(
                "Cadastro realizado com sucesso! Redirecionando para login...",
              );
              setName("");
              setEmail("");
              setPassword("");
              setRepeatPassword("");
              if (redirectTimeout) clearTimeout(redirectTimeout);
              const timeout = window.setTimeout(() => {
                if (onBackToLogin) onBackToLogin();
              }, 1500);
              setRedirectTimeout(timeout);
            } else {
              setMessage(result.error || "Erro ao cadastrar.");
            }
            setIsSubmitting(false);
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
        <PrimaryButton
          title="VOLTAR PARA LOGIN"
          onPress={onBackToLogin}
          style={{ backgroundColor: "#C8A24B", marginTop: 24 }}
          textStyle={{ color: "#5B3A29" }}
        />
      </View>
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
  },
  // button e buttonText agora estão em PrimaryButton.tsx
});

export default Register;
