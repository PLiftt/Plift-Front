import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getToken } from "services/secureStore";
import { getUserProfile } from "services/userService";
import { API_URL } from "@env";
import { ArrowLeft } from "lucide-react-native";
import { useAppContext } from "app/context/appContext";
import PullToRefresh from "../../../../components/PullToRefresh";

interface Exercise {
  id?: number;
  predefined_name?: string;
  custom_name?: string;
  name?: string;
  sets: number;
  reps: number;
  weight?: number;
  rpe?: number;
  weight_actual?: number;
  rpe_actual?: number;
  completed?: boolean;
  session?: number;
}

const EXERCISE_CHOICES = [
  "Sentadilla",
  "Bench Press",
  "Peso muerto",
  "Overhead Press",
  "Remo con barra",
  "Pull Up",
  "Dips",
  "Otro",
];

export default function ExercisesScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  const { isDarkMode, language } = useAppContext();

  // 🎨 Paleta por tema (solo estilos)
  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        surface: "#1E1E1E",
        surfaceAlt: "#111111",
        text: "#FFFFFF",
        subtext: "#9CA3AF",
        border: "#2A2A2A",
        accent: "#EF233C",
        success: "#22c55e",
        warn: "#f59e0b",
        overlay: "rgba(0,0,0,0.6)",
        chip: "#222222",
      }
    : {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceAlt: "#FFFFFF",
        text: "#111827",
        subtext: "#6B7280",
        border: "#E5E7EB",
        accent: "#EF233C",
        success: "#16a34a",
        warn: "#d97706",
        overlay: "rgba(0,0,0,0.25)",
        chip: "#F3F4F6",
      };

  // 🗣️ Textos UI (no toca EXERCISE_CHOICES ni payloads)
  const T = {
    title: language === "es" ? `Ejercicios de la sesión ${sessionId}` : `Session ${sessionId} exercises`,
    add: language === "es" ? "+ Añadir ejercicio" : "+ Add exercise",
    edit: language === "es" ? "Editar ejercicio" : "Edit exercise",
    log: language === "es" ? "Registrar progreso del atleta" : "Log athlete progress",
    sets: language === "es" ? "Sets" : "Sets",
    reps: language === "es" ? "Reps" : "Reps",
    plannedWeight: language === "es" ? "Peso planificado" : "Planned weight",
    plannedRpe: language === "es" ? "RPE objetivo" : "Target RPE",
    realWeight: language === "es" ? "Peso real" : "Actual weight",
    realRpe: language === "es" ? "RPE real" : "Actual RPE",
    completed: language === "es" ? "Ejercicio completado" : "Exercise completed",
    register: language === "es" ? "Registrar progreso" : "Log progress",
    cancel: language === "es" ? "Cancelar" : "Cancel",
    save: language === "es" ? "Guardar" : "Save",
    loadingErr: language === "es" ? "No se pudieron cargar los ejercicios" : "Could not load exercises",
    delConfirm: language === "es" ? "Confirmar eliminación" : "Confirm deletion",
    delMsg: (n: string) =>
      language === "es" ? `¿Eliminar el ejercicio "${n}"?` : `Delete exercise "${n}"?`,
    del: language === "es" ? "Eliminar" : "Delete",
    back: language === "es" ? "Volver" : "Back",
  };

  useEffect(() => {
    fetchRole();
  }, []);

  useEffect(() => {
    if (role) fetchExercises();
  }, [role]);

  const fetchRole = async () => {
    const user = await getUserProfile();
    setRole(user.role.toLowerCase());
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const token = await getToken("accessToken");
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/exercises/?session=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setExercises(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", T.loadingErr);
    } finally {
      setLoading(false);
    }
  };

  const saveExercise = async () => {
    if (!currentExercise) return;

    const token = await getToken("accessToken");
    const isCoach = role === "coach";

    const url = isCoach
      ? `${API_URL.replace(/\/$/, "")}/exercises/`
      : `${API_URL.replace(/\/$/, "")}/exercises/${currentExercise.id}/`;

    const payload: any = {};

    if (isCoach) {
      if (currentExercise.id) {
        // Editar ejercicio existente
        payload.predefined_name = currentExercise.predefined_name!;
        payload.custom_name =
          currentExercise.predefined_name === "Otro"
            ? currentExercise.custom_name || "Ejercicio personalizado"
            : "No aplica";
        payload.sets = currentExercise.sets;
        payload.reps = currentExercise.reps;
        payload.weight = currentExercise.weight;
        payload.rpe = currentExercise.rpe;

        try {
          const res = await fetch(url, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await res.text());
        } catch (err) {
          console.error(err);
          Alert.alert("Error", `No se pudo actualizar el ejercicio: ${err}`);
        }
      } else {
        // Crear ejercicio nuevo
        payload.session = sessionId;
        payload.predefined_name = currentExercise.predefined_name!;
        payload.custom_name =
          currentExercise.predefined_name === "Otro"
            ? currentExercise.custom_name || "Ejercicio personalizado"
            : "No aplica";
        payload.sets = currentExercise.sets;
        payload.reps = currentExercise.reps;
        payload.weight = currentExercise.weight;
        payload.rpe = currentExercise.rpe;

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await res.text());
        } catch (err) {
          console.error(err);
          Alert.alert("Error", `No se pudo crear el ejercicio: ${err}`);
        }
      }
    } else {
      // Atleta actualiza progreso
      payload.predefined_name = currentExercise.predefined_name || "Sentadilla";
      payload.custom_name =
        currentExercise.predefined_name === "Otro"
          ? currentExercise.custom_name || "Ejercicio personalizado"
          : "No aplica";
      payload.weight_actual = currentExercise.weight_actual || 0;
      payload.rpe_actual = currentExercise.rpe_actual || 0;
      payload.completed = currentExercise.completed || false;

      try {
        const res = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (err) {
        console.error(err);
        Alert.alert("Error", `No se pudo actualizar el ejercicio: ${err}`);
      }
    }

    setCurrentExercise(null);
    fetchExercises();
  };

  const deleteExercise = async (id: number) => {
    const token = await getToken("accessToken");
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/exercises/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error eliminando ejercicio");
      fetchExercises();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo eliminar el ejercicio");
    }
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <PullToRefresh contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={{ padding: 16 }} onPress={() => router.back()}>
          <ArrowLeft size={24} color={palette.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: palette.text, textAlign: "center" }]}>{T.title}</Text>

        {role === "coach" && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: isDarkMode ? "#3F3F46" : "#374151" }]}
            onPress={() =>
              setCurrentExercise({
                predefined_name: EXERCISE_CHOICES[0],
                sets: 0,
                reps: 0,
              })
            }
          >
            <Text style={styles.addButtonText}>{T.add}</Text>
          </TouchableOpacity>
        )}

        {/* Lista de ejercicios ordenada */}
        <View>
          {exercises
            ?.slice()
            .sort((a, b) => {
              if (a.completed === b.completed) return 0;
              return a.completed ? 1 : -1; // no completados arriba
            })
            .map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.card,
                  { backgroundColor: palette.surface, borderColor: palette.accent, borderWidth: 2, elevation: 4 },
                ]}
                activeOpacity={0.8}
              >
                <Text style={{ color: palette.text, fontWeight: "600", fontSize: 16 }}>
                  {item.name || "Sin nombre"}
                </Text>

                <Text style={{ color: palette.subtext }}>
                  {T.sets}: {item.sets} | {T.reps}: {item.reps}
                </Text>
                <Text style={{ color: palette.subtext }}>
                  {T.plannedWeight}: {item.weight || "-"} | {T.plannedRpe}: {item.rpe || "-"}
                </Text>
                <Text
                  style={{
                    color: item.completed ? palette.success : palette.warn,
                    fontWeight: "600",
                  }}
                >
                  {T.realWeight}: {item.weight_actual ?? "-"} | {T.realRpe}: {item.rpe_actual ?? "-"} |{" "}
                  {language === "es" ? "Completado" : "Completed"}: {item.completed ? (language === "es" ? "Sí" : "Yes") : (language === "es" ? "No" : "No")}
                </Text>

                {role === "coach" ? (
                  <View style={styles.buttonsRow}>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: isDarkMode ? "#3F3F46" : "#374151" }]}
                      onPress={() => setCurrentExercise(item)}
                    >
                      <Text style={styles.modalBtnText}>{language === "es" ? "Editar" : "Edit"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: palette.accent }]}
                      onPress={() => {
                        Alert.alert(
                          T.delConfirm,
                          T.delMsg(item.predefined_name || item.custom_name || (language === "es" ? "Sin nombre" : "Unnamed")),
                          [
                            { text: T.cancel, style: "cancel" },
                            { text: T.del, style: "destructive", onPress: () => deleteExercise(item.id!) },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.modalBtnText}>{T.del}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: palette.accent, marginTop: 10 }]}
                    onPress={() => setCurrentExercise(item)}
                  >
                    <Text style={styles.modalBtnText}>{T.register}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
        </View>

        {/* Modal */}
        <Modal visible={!!currentExercise} animationType="slide" transparent>
          <View style={[styles.modalBackground, { backgroundColor: palette.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                {role === "coach" ? T.edit : T.log}
              </Text>

              {role === "coach" ? (
                <>
                  <Picker
                    selectedValue={currentExercise?.predefined_name}
                    onValueChange={(value) =>
                      setCurrentExercise((prev) => (prev ? { ...prev, predefined_name: value } : null))
                    }
                    style={{ color: palette.text, backgroundColor: palette.surfaceAlt, marginBottom: 12 }}
                  >
                    {EXERCISE_CHOICES.map((ex) => (
                      <Picker.Item key={ex} label={ex} value={ex} />
                    ))}
                  </Picker>

                  {currentExercise?.predefined_name === "Otro" && (
                    <TextInput
                      placeholder={language === "es" ? "Nombre personalizado" : "Custom name"}
                      placeholderTextColor={palette.subtext}
                      style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}
                      value={currentExercise.custom_name || ""}
                      onChangeText={(text) =>
                        setCurrentExercise((prev) => (prev ? { ...prev, custom_name: text } : null))
                      }
                    />
                  )}

                  <TextInput
                    placeholder={T.sets}
                    placeholderTextColor={palette.subtext}
                    style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.sets === 0 || currentExercise?.sets == null
                        ? ""
                        : currentExercise.sets.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) => (prev ? { ...prev, sets: Number(text) } : null))
                    }
                  />
                  <TextInput
                    placeholder={T.reps}
                    placeholderTextColor={palette.subtext}
                    style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.reps === 0 || currentExercise?.reps == null
                        ? ""
                        : currentExercise.reps.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) => (prev ? { ...prev, reps: Number(text) } : null))
                    }
                  />
                  <TextInput
                    placeholder={language === "es" ? "Peso" : "Weight"}
                    placeholderTextColor={palette.subtext}
                    style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.weight === 0 || currentExercise?.weight == null
                        ? ""
                        : currentExercise.weight.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) => (prev ? { ...prev, weight: Number(text) } : null))
                    }
                  />
                  <TextInput
                    placeholder="RPE"
                    placeholderTextColor={palette.subtext}
                    style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.rpe === 0 || currentExercise?.rpe == null
                        ? ""
                        : currentExercise.rpe.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) => (prev ? { ...prev, rpe: Number(text) } : null))
                    }
                  />
                </>
              ) : (
                <>
                  <TextInput
                    placeholder={language === "es" ? "Peso actual (kg)" : "Actual weight (kg)"}
                    placeholderTextColor={palette.subtext}
                    style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.weight_actual === 0 || currentExercise?.weight_actual == null
                        ? ""
                        : currentExercise.weight_actual.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) => (prev ? { ...prev, weight_actual: Number(text) } : null))
                    }
                  />
                  <TextInput
                    placeholder={language === "es" ? "RPE real" : "Actual RPE"}
                    placeholderTextColor={palette.subtext}
                    style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.rpe_actual === 0 || currentExercise?.rpe_actual == null
                        ? ""
                        : currentExercise.rpe_actual.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) => (prev ? { ...prev, rpe_actual: Number(text) } : null))
                    }
                  />
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Switch
                      value={currentExercise?.completed || false}
                      onValueChange={(value) =>
                        setCurrentExercise((prev) => (prev ? { ...prev, completed: value } : null))
                      }
                    />
                    <Text style={{ color: palette.text, marginLeft: 8 }}>{T.completed}</Text>
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: isDarkMode ? "#3F3F46" : "#374151", flex: 1 }]}
                  onPress={() => setCurrentExercise(null)}
                >
                  <Text style={styles.modalBtnText}>{T.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: palette.accent, flex: 1 }]}
                  onPress={saveExercise}
                >
                  <Text style={styles.modalBtnText}>{T.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </PullToRefresh>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },

  addButton: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },

  card: { padding: 16, marginBottom: 10, borderRadius: 8 },

  exerciseName: { fontSize: 16, fontWeight: "600" },

  buttonsRow: { flexDirection: "row", marginTop: 10 },

  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center" },

  modalContent: { width: "90%", padding: 16, borderRadius: 8 },

  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },

  input: { borderWidth: 1, borderRadius: 6, padding: 8, marginBottom: 12 },

  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },

  modalBtn: { flex: 1, marginHorizontal: 5, padding: 12, borderRadius: 6, alignItems: "center" },

  modalBtnText: { color: "#fff", fontWeight: "bold" },
});
