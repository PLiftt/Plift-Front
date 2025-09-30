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
import { getUserProfile, updateProfile } from "../../../services/userService";
import { useRouter } from "expo-router";

export default function ProfileForm() {
  const router = useRouter();
  // Estado del formulario
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    secondLastName: "",
    weight: "",
    initialOneRM: {
      squat: "",
      benchPress: "",
      deadlift: "",
    },
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar datos del perfil al montar el componente
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setFormData({
          firstName: data.first_name || "",
          middleName: data.second_name || "", // 🔹 mapeo correcto
          lastName: data.last_name || "",
          secondLastName: data.second_last_name || "",
          weight: data.bodyweight_kg ? String(data.bodyweight_kg) : "", // 🔹 mapeo correcto
          initialOneRM: {
            squat: data.squat_1rm ? String(data.squat_1rm) : "", // 🔹 mapeo correcto
            benchPress: data.bench_1rm ? String(data.bench_1rm) : "",
            deadlift: data.deadlift_1rm ? String(data.deadlift_1rm) : "",
          },
        });
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      }
    };

    fetchProfile();
  }, []);

  // 🔹 Manejo de cambios en inputs
  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("initialOneRM.")) {
      const key = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        initialOneRM: { ...prev.initialOneRM, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // 🔹 Validación
  const validateForm = () => {
    const newErrors: any = {};

    // Campos de texto obligatorios
    if (!formData.firstName.trim())
      newErrors.firstName = "Primer Nombre es obligatorio";
    if (!formData.middleName.trim())
      newErrors.middleName = "Segundo Nombre es obligatorio";
    if (!formData.lastName.trim())
      newErrors.lastName = "Apellido es obligatorio";
    if (!formData.secondLastName.trim())
      newErrors.secondLastName = "Segundo Apellido es obligatorio";

    // Peso obligatorio y positivo
    if (!formData.weight.trim()) {
      newErrors.weight = "El peso es obligatorio";
    } else if (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) {
      newErrors.weight = "Por favor, ingresa un peso válido";
    }

    // 1RM obligatorios y positivos
    const { squat, benchPress, deadlift } = formData.initialOneRM;
    if (!squat.trim() || isNaN(Number(squat)) || Number(squat) <= 0) {
      newErrors.initialOneRM = {
        ...(newErrors.initialOneRM || {}),
        squat: "Squat obligatorio y positivo",
      };
    }
    if (
      !benchPress.trim() ||
      isNaN(Number(benchPress)) ||
      Number(benchPress) <= 0
    ) {
      newErrors.initialOneRM = {
        ...(newErrors.initialOneRM || {}),
        benchPress: "Bench Press obligatorio y positivo",
      };
    }
    if (!deadlift.trim() || isNaN(Number(deadlift)) || Number(deadlift) <= 0) {
      newErrors.initialOneRM = {
        ...(newErrors.initialOneRM || {}),
        deadlift: "Deadlift obligatorio y positivo",
      };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Enviar cambios al backend
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        first_name: formData.firstName,
        second_name: formData.middleName,
        last_name: formData.lastName,
        second_last_name: formData.secondLastName,
        bodyweight_kg: Number(formData.weight),
        squat_1rm: Number(formData.initialOneRM.squat),
        bench_1rm: Number(formData.initialOneRM.benchPress),
        deadlift_1rm: Number(formData.initialOneRM.deadlift),
      };

      await updateProfile(payload);

      Alert.alert(
        "✅ Perfil actualizado",
        "Tus cambios se guardaron con éxito"
      );
      router.push("/home"); // Redirigir a la página de inicio
    } catch (err) {
      Alert.alert("❌ Error", "No se pudo actualizar el perfil");
      console.error("Error en handleSubmit:", err);
    } finally {
      setLoading(false);
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
                onChangeText={(val) => handleInputChange("firstName", val)}
                style={[styles.input, errors.firstName && styles.inputError]}
              />
              {errors.firstName && (
                <Text style={styles.error}>{errors.firstName}</Text>
              )}

              <TextInput
                placeholder="Segundo Nombre"
                placeholderTextColor="#888"
                value={formData.middleName}
                onChangeText={(val) => handleInputChange("middleName", val)}
                style={styles.input}
              />

              <TextInput
                placeholder="Apellido"
                placeholderTextColor="#888"
                value={formData.lastName}
                onChangeText={(val) => handleInputChange("lastName", val)}
                style={[styles.input, errors.lastName && styles.inputError]}
              />
              {errors.lastName && (
                <Text style={styles.error}>{errors.lastName}</Text>
              )}

              <TextInput
                placeholder="Segundo Apellido"
                placeholderTextColor="#888"
                value={formData.secondLastName}
                onChangeText={(val) => handleInputChange("secondLastName", val)}
                style={styles.input}
              />
            </View>

            {/* Security */}
            {/* <View style={styles.section}>
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
              <TextInput
                placeholder="Confirmar contraseña"
                placeholderTextColor="#888"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(val) =>
                  handleInputChange("confirmPassword", val)
                }
                style={[
                  styles.input,
                  errors.confirmPassword && styles.inputError,
                ]}
              />
            </View> */}

            {/* Peso */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Dumbbell size={20} color="#EF233C" />
                <Text style={styles.sectionTitle}>Modificar Peso</Text>
              </View>
              <TextInput
                placeholder="Peso (kg)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={formData.weight}
                onChangeText={(val) => handleInputChange("weight", val)}
                style={[styles.input, errors.weight && styles.inputError]}
              />
            </View>

            {/* 1RM */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Dumbbell size={20} color="#EF233C" />
                <Text style={styles.sectionTitle}>1RM Inicial</Text>
              </View>
              <TextInput
                placeholder="Squat (kg)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={formData.initialOneRM.squat}
                onChangeText={(val) =>
                  handleInputChange("initialOneRM.squat", val)
                }
                style={[
                  styles.input,
                  errors.initialOneRM?.squat && styles.inputError,
                ]}
              />
              <TextInput
                placeholder="Bench Press (kg)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={formData.initialOneRM.benchPress}
                onChangeText={(val) =>
                  handleInputChange("initialOneRM.benchPress", val)
                }
                style={[
                  styles.input,
                  errors.initialOneRM?.benchPress && styles.inputError,
                ]}
              />
              <TextInput
                placeholder="Deadlift (kg)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={formData.initialOneRM.deadlift}
                onChangeText={(val) =>
                  handleInputChange("initialOneRM.deadlift", val)
                }
                style={[
                  styles.input,
                  errors.initialOneRM?.deadlift && styles.inputError,
                ]}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Guardar Cambios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, styles.resetButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Restablecer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos (se mantienen igual)
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
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
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
