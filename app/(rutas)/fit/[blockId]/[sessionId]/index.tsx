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

  const colors = {
    background: "#000",
    cardBackground: "#111",
    primary: "#EF233C",
    secondary: "#4CAF50",
    textPrimary: "#fff",
    muted: "#888",
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
      const res = await fetch(
        `${API_URL.replace(/\/$/, "")}/exercises/?session=${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setExercises(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar los ejercicios");
    } finally {
      setLoading(false);
    }
  };

  const saveExercise = async () => {
    if (!currentExercise) return;

    const token = await getToken("accessToken");
    const isCoach = role === "coach";

    const url = isCoach
      ? `${API_URL.replace(/\/$/, "")}/exercises/` // Crear nuevo si coach y no hay id
      : `${API_URL.replace(/\/$/, "")}/exercises/${currentExercise.id}/`; // PATCH atleta

    const payload: any = {};

    if (isCoach) {
      // Coach crea/edita ejercicio
      if (currentExercise.id) {
        // Editar
        payload.predefined_name = currentExercise.predefined_name!;
        payload.custom_name =
          currentExercise.predefined_name === "Otro"
            ? currentExercise.custom_name || "Ejercicio personalizado"
            : "No aplica";
        payload.sets = currentExercise.sets;
        payload.reps = currentExercise.reps;
        payload.weight = currentExercise.weight;
        payload.rpe = currentExercise.rpe;

        // PATCH
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
        // Crear
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
      // Atleta solo actualiza progreso
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
      const res = await fetch(
        `${API_URL.replace(/\/$/, "")}/exercises/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Error eliminando ejercicio");
      fetchExercises();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo eliminar el ejercicio");
    }
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={{ padding: 16 }} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            { color: colors.textPrimary, textAlign: "center" },
          ]}
        >
          Ejercicios de la sesión {sessionId}
        </Text>

        {role === "coach" && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#555" }]}
            onPress={() =>
              setCurrentExercise({
                predefined_name: EXERCISE_CHOICES[0],
                sets: 0,
                reps: 0,
              })
            }
          >
            <Text style={styles.addButtonText}>+ Añadir ejercicio</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id!.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.primary,
                  borderWidth: 2,
                  elevation: 4,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.exerciseName, { color: colors.textPrimary }]}
              >
                {item?.name || "Sin nombre"}
              </Text>

              <Text style={{ color: colors.muted }}>
                Sets: {item.sets} | Reps: {item.reps}
              </Text>
              <Text style={{ color: colors.muted }}>
                Peso planificado: {item.weight || "-"} | RPE objetivo:{" "}
                {item.rpe || "-"}
              </Text>
              <Text
                style={{
                  color: item.completed ? "green" : "orange",
                  fontWeight: "600",
                }}
              >
                Peso real: {item.weight_actual ?? "-"} | RPE real:{" "}
                {item.rpe_actual ?? "-"} | Completado:{" "}
                {item.completed ? "Sí" : "No"}
              </Text>

              {role === "coach" ? (
                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#555" }]}
                    onPress={() => setCurrentExercise(item)}
                  >
                    <Text style={styles.modalBtnText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => {
                      Alert.alert(
                        "Confirmar eliminación",
                        `¿Eliminar el ejercicio "${item.name}"?`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Eliminar",
                            style: "destructive",
                            onPress: () => deleteExercise(item.id!),
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.modalBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: colors.primary, marginTop: 10 },
                  ]}
                  onPress={() => setCurrentExercise(item)}
                >
                  <Text style={styles.modalBtnText}>Registrar progreso</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />

        {/* Modal */}
        <Modal visible={!!currentExercise} animationType="slide" transparent>
          <View style={styles.modalBackground}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {role === "coach"
                  ? "Editar ejercicio"
                  : "Registrar progreso del atleta"}
              </Text>

              {role === "coach" ? (
                <>
                  <Picker
                    selectedValue={currentExercise?.predefined_name}
                    onValueChange={(value) =>
                      setCurrentExercise((prev) =>
                        prev ? { ...prev, predefined_name: value } : null
                      )
                    }
                    style={{
                      color: colors.textPrimary,
                      backgroundColor: "#222",
                      marginBottom: 12,
                    }}
                  >
                    {EXERCISE_CHOICES.map((ex) => (
                      <Picker.Item key={ex} label={ex} value={ex} />
                    ))}
                  </Picker>

                  {currentExercise?.predefined_name === "Otro" && (
                    <TextInput
                      placeholder="Nombre personalizado"
                      placeholderTextColor={colors.muted}
                      style={[styles.input, { color: colors.textPrimary }]}
                      value={currentExercise.custom_name || ""}
                      onChangeText={(text) =>
                        setCurrentExercise((prev) =>
                          prev ? { ...prev, custom_name: text } : null
                        )
                      }
                    />
                  )}

                  <TextInput
                    placeholder="Sets"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { color: colors.textPrimary }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.sets === 0 ||
                      currentExercise?.sets == null
                        ? ""
                        : currentExercise.sets.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) =>
                        prev ? { ...prev, sets: Number(text) } : null
                      )
                    }
                  />
                  <TextInput
                    placeholder="Reps"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { color: colors.textPrimary }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.reps === 0 ||
                      currentExercise?.reps == null
                        ? ""
                        : currentExercise.reps.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) =>
                        prev ? { ...prev, reps: Number(text) } : null
                      )
                    }
                  />
                  <TextInput
                    placeholder="Peso"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { color: colors.textPrimary }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.weight === 0 ||
                      currentExercise?.weight == null
                        ? ""
                        : currentExercise.weight.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) =>
                        prev ? { ...prev, weight: Number(text) } : null
                      )
                    }
                  />
                  <TextInput
                    placeholder="RPE"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { color: colors.textPrimary }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.rpe === 0 || currentExercise?.rpe == null
                        ? ""
                        : currentExercise.rpe.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) =>
                        prev ? { ...prev, rpe: Number(text) } : null
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <TextInput
                    placeholder="Peso actual (kg)"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { color: colors.textPrimary }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.weight_actual === 0 ||
                      currentExercise?.weight_actual == null
                        ? ""
                        : currentExercise.weight_actual.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) =>
                        prev ? { ...prev, weight_actual: Number(text) } : null
                      )
                    }
                  />
                  <TextInput
                    placeholder="RPE real"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, { color: colors.textPrimary }]}
                    keyboardType="numeric"
                    value={
                      currentExercise?.rpe_actual === 0 ||
                      currentExercise?.rpe_actual == null
                        ? ""
                        : currentExercise.rpe_actual.toString()
                    }
                    onChangeText={(text) =>
                      setCurrentExercise((prev) =>
                        prev ? { ...prev, rpe_actual: Number(text) } : null
                      )
                    }
                  />
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Switch
                      value={currentExercise?.completed || false}
                      onValueChange={(value) =>
                        setCurrentExercise((prev) =>
                          prev ? { ...prev, completed: value } : null
                        )
                      }
                    />
                    <Text style={{ color: colors.textPrimary, marginLeft: 8 }}>
                      Ejercicio completado
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: "#555", flex: 1 },
                  ]}
                  onPress={() => setCurrentExercise(null)}
                >
                  <Text style={styles.modalBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: colors.primary, flex: 1 },
                  ]}
                  onPress={saveExercise}
                >
                  <Text style={styles.modalBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000099",
  },
  modalContent: { width: "90%", padding: 16, borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    borderColor: "#555",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "bold" },
});
