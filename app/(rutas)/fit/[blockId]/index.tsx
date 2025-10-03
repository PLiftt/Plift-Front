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
import { useRouter, useLocalSearchParams } from "expo-router";
import { getToken } from "services/secureStore";
import { getUserProfile } from "services/userService";
import { API_URL } from "@env";

interface Session {
  id?: number;
  date: string;
  notes?: string;
}

export default function SessionsScreen() {
  const router = useRouter();
  const { blockId } = useLocalSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchRole();
  }, []);

  useEffect(() => {
    if (role) fetchSessions();
  }, [role]);

  const fetchRole = async () => {
    const user = await getUserProfile();
    setRole(user.role);
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = await getToken("accessToken");
      const res = await fetch(
        `${API_URL.replace(/\/$/, "")}/sessions/?block=${blockId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar las sesiones");
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async () => {
    if (!currentSession) return;
    const token = await getToken("accessToken");
    let url = `${API_URL.replace(/\/$/, "")}/sessions/`;
    let method: "POST" | "PATCH" = "POST";
    if (currentSession.id) {
      url += `${currentSession.id}/`;
      method = "PATCH";
    }
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...currentSession, block: blockId }),
      });
      if (!res.ok) throw new Error("Error guardando sesión");
      setModalVisible(false);
      setCurrentSession(null);
      fetchSessions();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo guardar la sesión");
    }
  };

  const deleteSession = async (id: number) => {
    const token = await getToken("accessToken");
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/sessions/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error eliminando sesión");
      fetchSessions();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo eliminar la sesión");
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
      <Text style={styles.title}>Sesiones del bloque {blockId}</Text>

      {role === "coach" && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setCurrentSession({ date: "", notes: "" })}
        >
          <Text style={styles.addButtonText}>+ Añadir sesión</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/fit/${blockId}/${item.id}`)}
          >
            <Text style={styles.sessionName}>Sesión: {item.date}</Text>
            <Text>Notas: {item.notes || "-"}</Text>

            {role === "coach" && (
              <View style={styles.buttonsRow}>
                <Button
                  title="Editar"
                  onPress={() => setCurrentSession(item)}
                />
                <Button
                  title="Eliminar"
                  color="red"
                  onPress={() => deleteSession(item.id!)}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Modal */}
      <Modal
        visible={!!currentSession}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentSession?.id ? "Editar" : "Agregar"} Sesión
            </Text>
            <TextInput
              placeholder="Fecha YYYY-MM-DD"
              style={styles.input}
              value={currentSession?.date}
              onChangeText={(text) =>
                setCurrentSession((prev) =>
                  prev ? { ...prev, date: text } : null
                )
              }
            />
            <TextInput
              placeholder="Notas"
              style={styles.input}
              value={currentSession?.notes || ""}
              onChangeText={(text) =>
                setCurrentSession((prev) =>
                  prev ? { ...prev, notes: text } : null
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
                onPress={() => setCurrentSession(null)}
              />
              <Button title="Guardar" onPress={saveSession} />
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
  sessionName: { fontSize: 16, fontWeight: "600" },
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
