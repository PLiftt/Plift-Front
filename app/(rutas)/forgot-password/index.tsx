import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import {
  requestPasswordResetCode,
  confirmPasswordResetCode,
} from "services/authService";

export default function ResetPasswordScreen() {
  const router = useRouter(); // 🔹 Router para navegar al login
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Ingresa tu correo");
      return;
    }
    try {
      setIsLoading(true);
      await requestPasswordResetCode(email);
      Alert.alert("Código enviado", "Revisa tu correo");
      setCodeSent(true);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    try {
      setIsLoading(true);
      await confirmPasswordResetCode(email, code, newPassword);
      Alert.alert("Éxito", "Contraseña actualizada correctamente");

      // Limpiar campos
      setEmail("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setCodeSent(false);

      // Redirigir al login
      router.push("/login");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#111" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: 400 }}>
          <View style={styles.card}>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo para recibir un código de verificación
            </Text>

            {!codeSent && (
              <>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={handleSendCode}
                  style={styles.button}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "Enviando..." : "Enviar código"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {codeSent && (
              <>
                <Text style={styles.sectionTitle}>Código de recuperación</Text>
                <TextInput
                  placeholder="Código"
                  placeholderTextColor="#888"
                  value={code}
                  onChangeText={setCode}
                  style={styles.input}
                />
                <Text style={styles.sectionTitle}>Nueva contraseña</Text>
                <TextInput
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#888"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={styles.input}
                  secureTextEntry
                />
                <TextInput
                  placeholder="Confirmar nueva contraseña"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  secureTextEntry
                />
                <TouchableOpacity
                  onPress={handleResetPassword}
                  style={styles.button}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "Restableciendo..." : "Restablecer Contraseña"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: { fontSize: 16, color: "#E5E7EB", marginBottom: 8 },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "#374151",
  },
  button: {
    backgroundColor: "#EF233C",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
