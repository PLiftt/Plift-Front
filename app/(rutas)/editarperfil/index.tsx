import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  // ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { User, Lock, Dumbbell, ArrowLeft } from "lucide-react-native";
import { getUserProfile, updateProfile } from "../../../services/userService";
import { useRouter } from "expo-router";
import { useAppContext } from "app/context/appContext";
import PullToRefresh from "../../components/PullToRefresh";

export default function ProfileForm() {
  const router = useRouter();
  const { isDarkMode, language } = useAppContext();

  // 🎨 Paleta por tema (solo estilos)
  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        card: "#1F1F1F",
        input: "#111",
        text: "#fff",
        subtext: "#ccc",
        placeholder: "#888",
        borderErr: "#d00000",
        accent: "#EF233C",
        neutralBtn: "#555",
      }
    : {
        background: "#F8FAFC",
        card: "#FFFFFF",
        input: "#FFFFFF",
        text: "#111827",
        subtext: "#6B7280",
        placeholder: "#9CA3AF",
        borderErr: "#dc2626",
        accent: "#EF233C",
        neutralBtn: "#374151",
      };

  // 🗣️ Textos (no cambia tu lógica)
  const T = {
    header: language === "es" ? "Editar Perfil" : "Edit Profile",
    subtitle:
      language === "es"
        ? "Actualiza tu información personal y métricas de entrenamiento"
        : "Update your personal info and training metrics",
    personalInfo: language === "es" ? "Información Personal" : "Personal Info",
    firstName: language === "es" ? "Primer Nombre" : "First Name",
    middleName: language === "es" ? "Segundo Nombre" : "Middle Name",
    lastName: language === "es" ? "Apellido" : "Last Name",
    secondLastName: language === "es" ? "Segundo Apellido" : "Second Last Name",
    weightTitle: language === "es" ? "Modificar Peso" : "Edit Weight",
    weightPh: language === "es" ? "Peso (kg)" : "Weight (kg)",
    oneRmTitle: language === "es" ? "1RM Inicial" : "Initial 1RM",
    squatPh: "Squat (kg)",
    benchPh: "Bench Press (kg)",
    deadliftPh: "Deadlift (kg)",
    save: language === "es" ? "Guardar Cambios" : "Save Changes",
    reset: language === "es" ? "Restablecer" : "Reset",
    back: language === "es" ? "Volver a Perfil" : "Back to Profile",
    // alerts
    updatedTitle: language === "es" ? "✅ Perfil actualizado" : "✅ Profile updated",
    updatedMsg:
      language === "es"
        ? "Tus cambios se guardaron con éxito"
        : "Your changes were saved successfully",
    updateErrTitle: language === "es" ? "❌ Error" : "❌ Error",
    updateErrMsg:
      language === "es"
        ? "No se pudo actualizar el perfil"
        : "Could not update profile",
    // validation (mantengo los mismos textos originales en ES para no alterar tu UX)
    vFirst: "Primer Nombre es obligatorio",
    vMiddle: "Segundo Nombre es obligatorio",
    vLast: "Apellido es obligatorio",
    vSecondLast: "Segundo Apellido es obligatorio",
    vWeightReq: "El peso es obligatorio",
    vWeightNum: "Por favor, ingresa un peso válido",
    vSquat: "Squat obligatorio y positivo",
    vBench: "Bench Press obligatorio y positivo",
    vDead: "Deadlift obligatorio y positivo",
  };

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
          middleName: data.second_name || "",
          lastName: data.last_name || "",
          secondLastName: data.second_last_name || "",
          weight: data.bodyweight_kg ? String(data.bodyweight_kg) : "",
          initialOneRM: {
            squat: data.squat_1rm ? String(data.squat_1rm) : "",
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

  // 🔹 Validación (misma lógica, textos mantenidos)
  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.firstName.trim()) newErrors.firstName = T.vFirst;
    if (!formData.middleName.trim()) newErrors.middleName = T.vMiddle;
    if (!formData.lastName.trim()) newErrors.lastName = T.vLast;
    if (!formData.secondLastName.trim()) newErrors.secondLastName = T.vSecondLast;

    if (!formData.weight.trim()) {
      newErrors.weight = T.vWeightReq;
    } else if (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0) {
      newErrors.weight = T.vWeightNum;
    }

    const { squat, benchPress, deadlift } = formData.initialOneRM;
    if (!squat.trim() || isNaN(Number(squat)) || Number(squat) <= 0) {
      newErrors.initialOneRM = { ...(newErrors.initialOneRM || {}), squat: T.vSquat };
    }
    if (!benchPress.trim() || isNaN(Number(benchPress)) || Number(benchPress) <= 0) {
      newErrors.initialOneRM = { ...(newErrors.initialOneRM || {}), benchPress: T.vBench };
    }
    if (!deadlift.trim() || isNaN(Number(deadlift)) || Number(deadlift) <= 0) {
      newErrors.initialOneRM = { ...(newErrors.initialOneRM || {}), deadlift: T.vDead };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Enviar cambios al backend (misma lógica)
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

      Alert.alert(T.updatedTitle, T.updatedMsg);
      router.push("/perfil"); // ← volver al perfil (según pediste)
    } catch (err) {
      Alert.alert(T.updateErrTitle, T.updateErrMsg);
      console.error("Error en handleSubmit:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <PullToRefresh
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          padding: 20,
          paddingBottom: 40,
        }}
        onRefresh={async () => { try { const d = await getUserProfile(); setFormData({ firstName: d.first_name || "", middleName: d.second_name || "", lastName: d.last_name || "", secondLastName: d.second_last_name || "", weight: d.bodyweight_kg ? String(d.bodyweight_kg) : "", initialOneRM: { squat: d.squat_1rm ? String(d.squat_1rm) : "", benchPress: d.bench_1rm ? String(d.bench_1rm) : "", deadlift: d.deadlift_1rm ? String(d.deadlift_1rm) : "", }, }); } catch(e) { console.warn(e); } }}
      >
        <View style={{ width: "100%", maxWidth: 400 }}>
          {/* Header con botón volver */}
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
            onPress={() => router.push("/perfil")}
          >
            <ArrowLeft size={22} color={palette.text} />
            <Text style={{ color: palette.text, marginLeft: 8, fontWeight: "600" }}>{T.back}</Text>
          </TouchableOpacity>

          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.title, { color: palette.text }]}>{T.header}</Text>
            <Text style={[styles.subtitle, { color: palette.subtext }]}>{T.subtitle}</Text>

            {/* Personal Info */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={20} color={palette.accent} />
                <Text style={[styles.sectionTitle, { color: palette.text }]}>{T.personalInfo}</Text>
              </View>

              <TextInput
                placeholder={T.firstName}
                placeholderTextColor={palette.placeholder}
                value={formData.firstName}
                onChangeText={(val) => handleInputChange("firstName", val)}
                style={[
                  styles.input,
                  { backgroundColor: palette.input, color: palette.text },
                  errors.firstName && { borderWidth: 1, borderColor: palette.borderErr },
                ]}
              />
              {errors.firstName && <Text style={[styles.error, { color: palette.borderErr }]}>{errors.firstName}</Text>}

              <TextInput
                placeholder={T.middleName}
                placeholderTextColor={palette.placeholder}
                value={formData.middleName}
                onChangeText={(val) => handleInputChange("middleName", val)}
                style={[styles.input, { backgroundColor: palette.input, color: palette.text }]}
              />

              <TextInput
                placeholder={T.lastName}
                placeholderTextColor={palette.placeholder}
                value={formData.lastName}
                onChangeText={(val) => handleInputChange("lastName", val)}
                style={[
                  styles.input,
                  { backgroundColor: palette.input, color: palette.text },
                  errors.lastName && { borderWidth: 1, borderColor: palette.borderErr },
                ]}
              />
              {errors.lastName && <Text style={[styles.error, { color: palette.borderErr }]}>{errors.lastName}</Text>}

              <TextInput
                placeholder={T.secondLastName}
                placeholderTextColor={palette.placeholder}
                value={formData.secondLastName}
                onChangeText={(val) => handleInputChange("secondLastName", val)}
                style={[styles.input, { backgroundColor: palette.input, color: palette.text }]}
              />
            </View>

            {/* Peso */}
            <View className="section" style={styles.section}>
              <View style={styles.sectionHeader}>
                <Dumbbell size={20} color={palette.accent} />
                <Text style={[styles.sectionTitle, { color: palette.text }]}>{T.weightTitle}</Text>
              </View>
              <TextInput
                placeholder={T.weightPh}
                placeholderTextColor={palette.placeholder}
                keyboardType="numeric"
                value={formData.weight}
                onChangeText={(val) => handleInputChange("weight", val)}
                style={[
                  styles.input,
                  { backgroundColor: palette.input, color: palette.text },
                  errors.weight && { borderWidth: 1, borderColor: palette.borderErr },
                ]}
              />
            </View>

            {/* 1RM */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Dumbbell size={20} color={palette.accent} />
                <Text style={[styles.sectionTitle, { color: palette.text }]}>{T.oneRmTitle}</Text>
              </View>

              <TextInput
                placeholder={T.squatPh}
                placeholderTextColor={palette.placeholder}
                keyboardType="numeric"
                value={formData.initialOneRM.squat}
                onChangeText={(val) => handleInputChange("initialOneRM.squat", val)}
                style={[
                  styles.input,
                  { backgroundColor: palette.input, color: palette.text },
                  errors.initialOneRM?.squat && { borderWidth: 1, borderColor: palette.borderErr },
                ]}
              />

              <TextInput
                placeholder={T.benchPh}
                placeholderTextColor={palette.placeholder}
                keyboardType="numeric"
                value={formData.initialOneRM.benchPress}
                onChangeText={(val) => handleInputChange("initialOneRM.benchPress", val)}
                style={[
                  styles.input,
                  { backgroundColor: palette.input, color: palette.text },
                  errors.initialOneRM?.benchPress && { borderWidth: 1, borderColor: palette.borderErr },
                ]}
              />

              <TextInput
                placeholder={T.deadliftPh}
                placeholderTextColor={palette.placeholder}
                keyboardType="numeric"
                value={formData.initialOneRM.deadlift}
                onChangeText={(val) => handleInputChange("initialOneRM.deadlift", val)}
                style={[
                  styles.input,
                  { backgroundColor: palette.input, color: palette.text },
                  errors.initialOneRM?.deadlift && { borderWidth: 1, borderColor: palette.borderErr },
                ]}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: palette.accent }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{T.save}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: palette.neutralBtn }]}
                onPress={handleSubmit /* (mantengo tu lógica original) */}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{T.reset}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </PullToRefresh>
    </KeyboardAvoidingView>
  );
}

// Estilos base (mantengo estructura y tamaños; colores se sobrescriben con palette)
const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
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
  sectionTitle: { fontSize: 18, fontWeight: "600" },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: "100%",
  },
  inputError: { borderWidth: 1 },
  error: { marginBottom: 6 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
