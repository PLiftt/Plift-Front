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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getToken } from "services/secureStore";
import { getUserProfile } from "services/userService";
import { API_URL } from "@env";
import { ArrowLeft } from "lucide-react-native";

interface Exercise {
  id?: number;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rpe?: number;
  completed?: boolean;
}

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

  useEffect(() => { fetchRole(); }, []);
  useEffect(() => { if (role) fetchExercises(); }, [role]);

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
    let url = `${API_URL.replace(/\/$/, "")}/exercises/`;
    let method: "POST" | "PATCH" = "POST";
    if (currentExercise.id) { url += `${currentExercise.id}/`; method = "PATCH"; }

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...currentExercise, session: sessionId }),
      });
      if (!res.ok) throw new Error("Error guardando ejercicio");
      setCurrentExercise(null);
      fetchExercises();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo guardar el ejercicio");
    }
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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {/* Flecha volver atrás */}
        <TouchableOpacity style={{ padding: 16 }} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.textPrimary, textAlign: "center" }]}>
          Ejercicios de la sesión {sessionId}
        </Text>

        {role === "coach" && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#555" }]}
            onPress={() => setCurrentExercise({ name: "", sets: 3, reps: 5 })}
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
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.5,
                  shadowRadius: 4,
                  elevation: 4,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={{ color: colors.muted }}>
                Sets: {item.sets} | Reps: {item.reps} | Peso: {item.weight || "-"}
              </Text>
              <Text style={{ color: colors.muted }}>
                RPE: {item.rpe || "-"} | Completado: {item.completed ? "Sí" : "No"}
              </Text>

              {role === "coach" && (
                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#555", flex: 1, marginRight: 8 }]}
                    onPress={() => setCurrentExercise(item)}
                  >
                    <Text style={styles.modalBtnText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
                    onPress={() => deleteExercise(item.id!)}
                  >
                    <Text style={styles.modalBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        />

        {/* Modal */}
        <Modal visible={!!currentExercise} animationType="slide" transparent>
          <View style={styles.modalBackground}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {currentExercise?.id ? "Editar" : "Agregar"} Ejercicio
              </Text>
              <TextInput
                placeholder="Nombre"
                placeholderTextColor={colors.muted}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
                value={currentExercise?.name}
                onChangeText={(text) =>
                  setCurrentExercise((prev) => (prev ? { ...prev, name: text } : null))
                }
              />
              <TextInput
                placeholder="Sets"
                placeholderTextColor={colors.muted}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
                keyboardType="numeric"
                value={currentExercise?.sets.toString()}
                onChangeText={(text) =>
                  setCurrentExercise((prev) => (prev ? { ...prev, sets: Number(text) } : null))
                }
              />
              <TextInput
                placeholder="Reps"
                placeholderTextColor={colors.muted}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
                keyboardType="numeric"
                value={currentExercise?.reps.toString()}
                onChangeText={(text) =>
                  setCurrentExercise((prev) => (prev ? { ...prev, reps: Number(text) } : null))
                }
              />
              <TextInput
                placeholder="Peso"
                placeholderTextColor={colors.muted}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
                keyboardType="numeric"
                value={currentExercise?.weight?.toString() || ""}
                onChangeText={(text) =>
                  setCurrentExercise((prev) => (prev ? { ...prev, weight: Number(text) } : null))
                }
              />
              <TextInput
                placeholder="RPE"
                placeholderTextColor={colors.muted}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
                keyboardType="numeric"
                value={currentExercise?.rpe?.toString() || ""}
                onChangeText={(text) =>
                  setCurrentExercise((prev) => (prev ? { ...prev, rpe: Number(text) } : null))
                }
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#555", flex: 1, marginRight: 8 }]}
                  onPress={() => setCurrentExercise(null)}
                >
                  <Text style={styles.modalBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
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
  addButton: { marginBottom: 16, padding: 12, borderRadius: 8, alignItems: "center" },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  card: { padding: 16, marginBottom: 10, borderRadius: 8 },
  exerciseName: { fontSize: 16, fontWeight: "600" },
  buttonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000099" },
  modalContent: { width: "90%", padding: 16, borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, marginBottom: 12 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  modalBtn: { flex: 1, marginHorizontal: 5, padding: 12, borderRadius: 6, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "bold" },
});
