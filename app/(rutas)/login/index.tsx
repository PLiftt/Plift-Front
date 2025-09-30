import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Image,
  ImageBackground,
  Switch,
  Alert,
} from "react-native";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { loginUser } from "services/authService";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    // Validación de campos vacíos
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos Vacíos", "Ingresa tu Email y Contraseña");
      return;
    }

    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Email inválido", "Por favor ingresa un email válido");
      return;
    }

    try {
      setIsLoading(true);
      const payload = { email, password };
      const user = await loginUser(payload, rememberMe);

      // Validar login exitoso
      if (user && (user.token || user.access)) {
        router.push("/(rutas)/home");
      } else {
        Alert.alert("Error", "Correo o contraseña incorrectos");
      }
    } catch (error: any) {
      console.error("Error en login:", error.response?.data || error.message);

      // Diferenciar errores comunes
      if (error.response?.status === 404) {
        Alert.alert("Usuario no encontrado", "El correo ingresado no existe");
      } else if (error.response?.status === 401) {
        Alert.alert("Credenciales inválidas", "Correo o contraseña incorrectas");
      } else if (error.response?.status === 500) {
        Alert.alert("Error del servidor", "Inténtalo más tarde");
      } else {
        Alert.alert("Error", "Hubo un problema al iniciar sesión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../../../assets/fondobg.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          {/* Logo */}
          <Image
            source={require("../../../assets/logoplift.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Bienvenido a PLift</Text>
          <Text style={styles.subtitle}>Únete a Nosotros</Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Ingresa tu email"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me Switch */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: "#374151", true: "#EF233C" }}
              thumbColor={rememberMe ? "#fff" : "#9CA3AF"}
            />
            <Text style={{ color: "#E5E7EB", marginLeft: 8 }}> Mantener sesión iniciada </Text>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            disabled={isLoading}
            onPress={handleLogin}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => {
              if (!email.trim()) {
                Alert.alert("Recuperar contraseña", "Por favor ingresa tu email para recuperar la contraseña");
              } else {
                Alert.alert("Recuperar contraseña", `Se ha enviado un enlace de recuperación a ${email}`);
              }
            }}
          >
            <Text style={styles.forgotText}>Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Switch to register */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>No tienes una cuenta?</Text>
            <Link href={"/register"} asChild>
              <Text style={styles.switchButton}>Crea tu cuenta aquí</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  keyboardView: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  backgroundImage: { position: "absolute", width: "100%", height: "100%" },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#E5E7EB", textAlign: "center", paddingVertical: 8, marginBottom: 4 },
  logo: { width: 120, height: 120, alignSelf: "center", marginBottom: 16 },
  subtitle: { fontSize: 16, color: "#9CA3AF", fontWeight: "600", textAlign: "center", marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#E5E7EB", marginBottom: 4 },
  inputWrapper: { position: "relative" },
  icon: { position: "absolute", marginTop: 4, left: 12, top: 12 },
  input: { height: 48, backgroundColor: "#1F1F1F", borderColor: "#374151", borderWidth: 1, borderRadius: 12, fontSize: 16, color: "#E5E7EB", textAlign: "center" },
  eyeButton: { position: "absolute", marginTop: 4, right: 12, top: 12 },
  button: { height: 48, backgroundColor: "#EF233C", borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  forgotButton: { marginTop: 12, alignItems: "center" },
  forgotText: { fontSize: 14, color: "#9CA3AF" },
  switchContainer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  switchText: { fontSize: 14, color: "#9CA3AF", marginRight: 4 },
  switchButton: { fontSize: 14, color: "#EF233C", fontWeight: "600" },
});
