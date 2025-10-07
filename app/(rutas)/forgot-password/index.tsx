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
import { Ionicons } from "@expo/vector-icons";
import {
  requestPasswordResetCode,
  confirmPasswordResetCode,
} from "services/authService";

export default function ResetPasswordScreen() {
  const router = useRouter();
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
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Flecha de retroceso pegada al header */}
        <TouchableOpacity
          style={styles.backButtonHeader}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Contenedor para centrar solo la card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo para recibir un código de verificación
            </Text>

            {!codeSent && (
              <>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  placeholder="tucorreo@ejemplo.com"
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
  backButtonHeader: {
    marginTop: 20,
    marginLeft: 20,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center", // 🔹 Centra verticalmente solo la card
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 25,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#E5E7EB",
    marginBottom: 6,
    marginLeft: 2,
  },
  sectionTitle: { fontSize: 16, color: "#E5E7EB", marginBottom: 10 },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "#374151",
  },
  button: {
    backgroundColor: "#EF233C",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
