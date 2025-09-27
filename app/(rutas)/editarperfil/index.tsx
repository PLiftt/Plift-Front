import React, { useState, useEffect } from "react";
import {
View,
Text,
TextInput,
TouchableOpacity,
ScrollView,
StyleSheet,
KeyboardAvoidingView,
Platform,
Alert,
} from "react-native";
import { User, Lock, Dumbbell } from "lucide-react-native";

export default function ProfileForm() {
  // simular carga desde API
const [userData, setUserData] = useState({ firstName: "", middleName: "" });

useEffect(() => {
    // Simular fetch de datos del usuario
    setUserData({ firstName: "Alonso", middleName: "Barrera" });
}, []);

const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    password: "",
    confirmPassword: "",
    weight: "",
    initialOneRM: "",
});

const [errors, setErrors] = useState<Record<string, string>>({});

useEffect(() => {
    // al cargar datos del usuario, setear los campos no editables
    setFormData((prev) => ({
      ...prev,
      firstName: userData.firstName,
      middleName: userData.middleName,
    }));
  }, [userData]);

const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Primer Nombre es obligatorio";
    if (formData.password && formData.password.length < 8)
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0))
      newErrors.weight = "Por favor, ingresa un peso válido";
    if (formData.initialOneRM && (isNaN(Number(formData.initialOneRM)) || Number(formData.initialOneRM) <= 0))
      newErrors.initialOneRM = "Por favor, ingresa un 1RM válido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      Alert.alert("Perfil actualizado", JSON.stringify(formData));
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: userData.firstName,
      middleName: userData.middleName,
      password: "",
      confirmPassword: "",
      weight: "",
      initialOneRM: "",
    });
    setErrors({});
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
            <Text style={styles.title}>Editar Perfil</Text>
            <Text style={styles.subtitle}>
              Actualiza tu información personal y métricas de entrenamiento
            </Text>

            {/* Personal Info */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={20} color="#EF233C" />
                <Text style={styles.sectionTitle}>Información Personal</Text>
              </View>
              <TextInput
                placeholder="Primer Nombre"
                placeholderTextColor="#888"
                value={formData.firstName}
                editable={false}
                style={[styles.input, { opacity: 0.6 }]}
              />
              {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}

              <TextInput
                placeholder="Segundo Nombre"
                placeholderTextColor="#888"
                value={formData.middleName}
                editable={false}
                style={[styles.input, { opacity: 0.6 }]}
              />
            </View>

            {/* Security */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lock size={20} color="#EF233C" />
                <Text style={styles.sectionTitle}>Seguridad</Text>
              </View>
              <TextInput
                placeholder="Nueva contraseña"
                placeholderTextColor="#888"
                secureTextEntry
                value={formData.password}
                onChangeText={(val) => handleInputChange("password", val)}
                style={[styles.input, errors.password && styles.inputError]}
              />
              {errors.password && <Text style={styles.error}>{errors.password}</Text>}

              <TextInput
                placeholder="Confirmar contraseña"
                placeholderTextColor="#888"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(val) => handleInputChange("confirmPassword", val)}
                style={[styles.input, errors.confirmPassword && styles.inputError]}
              />
              {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
            </View>

            {/* Fitness Metrics */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Dumbbell size={20} color="#EF233C" />
                <Text style={styles.sectionTitle}>Metricas de Entrenamiento</Text>
              </View>
              <TextInput
                placeholder="Peso (kg)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={formData.weight}
                onChangeText={(val) => handleInputChange("weight", val)}
                style={[styles.input, errors.weight && styles.inputError]}
              />
              {errors.weight && <Text style={styles.error}>{errors.weight}</Text>}

              <TextInput
                placeholder="1RM Inicial (kg)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={formData.initialOneRM}
                onChangeText={(val) => handleInputChange("initialOneRM", val)}
                style={[styles.input, errors.initialOneRM && styles.inputError]}
              />
              {errors.initialOneRM && <Text style={styles.error}>{errors.initialOneRM}</Text>}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Guardar Cambios</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.submitButton, styles.resetButton]} onPress={handleReset}>
                <Text style={styles.buttonText}>Restablecer</Text>
              </TouchableOpacity>
            </View>
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
  title: { fontSize: 26, fontWeight: "700", color: "#fff", marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#ccc", marginBottom: 20, textAlign: "center" },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: "100%",
  },
  inputError: { borderWidth: 1, borderColor: "#d00000" },
  error: { color: "#d00000", marginBottom: 6 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  submitButton: {
    flex: 1,
    backgroundColor: "#EF233C",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  resetButton: { backgroundColor: "#555" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
