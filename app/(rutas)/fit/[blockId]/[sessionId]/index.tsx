import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getToken } from "services/secureStore";
import { getUserProfile } from "services/userService";
import { API_URL } from "@env";

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
  const { blockId, sessionId } = useLocalSearchParams();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    fetchRole();
  }, []);

  useEffect(() => {
    if (role) fetchExercises();
  }, [role]);

  const fetchRole = async () => {
    const user = await getUserProfile();
    setRole(user.role);
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const token = await getToken("accessToken");
      const res = await fetch(
        `${API_URL.replace(/\/$/, "")}/exercises/?session=${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
    if (currentExercise.id) {
      url += `${currentExercise.id}/`;
      method = "PATCH";
    }
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ejercicios de la sesión {sessionId}</Text>

      {role === "coach" && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setCurrentExercise({ name: "", sets: 3, reps: 5 })}
        >
          <Text style={styles.addButtonText}>+ Añadir ejercicio</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text>
              Sets: {item.sets} | Reps: {item.reps} | Peso: {item.weight || "-"}
            </Text>
            <Text>
              RPE: {item.rpe || "-"} | Completado:{" "}
              {item.completed ? "Sí" : "No"}
            </Text>

            {role === "coach" && (
              <View style={styles.buttonsRow}>
                <Button
                  title="Editar"
                  onPress={() => setCurrentExercise(item)}
                />
                <Button
                  title="Eliminar"
                  color="red"
                  onPress={() => deleteExercise(item.id!)}
                />
              </View>
            )}
          </View>
        )}
      />

      {/* Modal */}
      <Modal
        visible={!!currentExercise}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentExercise?.id ? "Editar" : "Agregar"} Ejercicio
            </Text>
            <TextInput
              placeholder="Nombre"
              style={styles.input}
              value={currentExercise?.name}
              onChangeText={(text) =>
                setCurrentExercise((prev) =>
                  prev ? { ...prev, name: text } : null
                )
              }
            />
            <TextInput
              placeholder="Sets"
              style={styles.input}
              keyboardType="numeric"
              value={currentExercise?.sets.toString()}
              onChangeText={(text) =>
                setCurrentExercise((prev) =>
                  prev ? { ...prev, sets: Number(text) } : null
                )
              }
            />
            <TextInput
              placeholder="Reps"
              style={styles.input}
              keyboardType="numeric"
              value={currentExercise?.reps.toString()}
              onChangeText={(text) =>
                setCurrentExercise((prev) =>
                  prev ? { ...prev, reps: Number(text) } : null
                )
              }
            />
            <TextInput
              placeholder="Peso"
              style={styles.input}
              keyboardType="numeric"
              value={currentExercise?.weight?.toString() || ""}
              onChangeText={(text) =>
                setCurrentExercise((prev) =>
                  prev ? { ...prev, weight: Number(text) } : null
                )
              }
            />
            <TextInput
              placeholder="RPE"
              style={styles.input}
              keyboardType="numeric"
              value={currentExercise?.rpe?.toString() || ""}
              onChangeText={(text) =>
                setCurrentExercise((prev) =>
                  prev ? { ...prev, rpe: Number(text) } : null
                )
              }
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <Button
                title="Cancelar"
                onPress={() => setCurrentExercise(null)}
              />
              <Button title="Guardar" onPress={saveExercise} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  addButton: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  card: {
    padding: 16,
    marginBottom: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  exerciseName: { fontSize: 16, fontWeight: "600" },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000099",
  },
  modalContent: {
    width: "90%",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
});
