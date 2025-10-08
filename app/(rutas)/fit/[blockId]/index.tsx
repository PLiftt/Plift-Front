import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getToken } from "services/secureStore";
import { getUserProfile } from "services/userService";
import { API_URL } from "@env";
import { ArrowLeft } from "lucide-react-native";

interface Session {
  id?: number;
  date: string;
  notes?: string;
  completed?: boolean;
}

export default function SessionsScreen() {
  const router = useRouter();
  const { blockId } = useLocalSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const colors = {
    background: "#000",
    cardBackground: "#111",
    primary: "#EF233C",
    muted: "#888",
    textPrimary: "#fff",
  };

  useEffect(() => {
    fetchRole();
  }, []);

  useEffect(() => {
    if (role) fetchSessions();
  }, [role]);

  const fetchRole = async () => {
    const user = await getUserProfile();
    setRole(user.role.toLowerCase());
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
        {/* Flecha volver atrás */}
        <TouchableOpacity style={{ padding: 16 }} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            { color: colors.textPrimary, textAlign: "center" },
          ]}
        >
          Sesiones del bloque {blockId}
        </Text>

        {role === "coach" && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#555" }]}
            onPress={() => setCurrentSession({ date: "", notes: "" })}
          >
            <Text style={styles.addButtonText}>+ Añadir sesión</Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
          Sesiones
        </Text>

        <FlatList
          data={sessions}
          keyExtractor={(item, index) =>
            item?.id ? item.id!.toString() : index.toString()
          }
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBackground, // Siempre mismo fondo
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => router.push(`/fit/${blockId}/${item.id}`)}
            >
              <Text style={[styles.blockName, { color: colors.textPrimary }]}>
                Sesión: {item.date}
              </Text>
              <Text style={{ color: colors.textPrimary }}>
                Notas: {item.notes || "-"}
              </Text>
              <Text
                style={{
                  color: item.completed ? "green" : "orange",
                  fontWeight: "600",
                }}
              >
                Sesión completada: {item.completed ? "Sí" : "No"}
              </Text>

              {role === "coach" && (
                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: "#555", flex: 1, marginRight: 8 },
                    ]} // color gris oscuro, no verde
                    onPress={() => setCurrentSession(item)}
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
                        `¿Estás seguro de que deseas eliminar la sesión "${item.date}"?`,
                        [
                          {
                            text: "Cancelar",
                            style: "cancel",
                          },
                          {
                            text: "Eliminar",
                            style: "destructive",
                            onPress: () => deleteSession(item.id!),
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.modalBtnText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </ScrollView>

      {/* Modal */}
      <Modal visible={!!currentSession} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {currentSession?.id ? "Editar" : "Agregar"} Sesión
            </Text>
            <TextInput
              placeholder="Fecha YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { color: colors.textPrimary, borderColor: colors.muted },
              ]}
              value={currentSession?.date}
              onChangeText={(text) =>
                setCurrentSession((prev) =>
                  prev ? { ...prev, date: text } : null
                )
              }
            />
            <TextInput
              placeholder="Notas"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { color: colors.textPrimary, borderColor: colors.muted },
              ]}
              value={currentSession?.notes || ""}
              onChangeText={(text) =>
                setCurrentSession((prev) =>
                  prev ? { ...prev, notes: text } : null
                )
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: "#555", flex: 1, marginRight: 8 },
                ]}
                onPress={() => setCurrentSession(null)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.primary, flex: 1 },
                ]}
                onPress={saveSession}
              >
                <Text style={styles.modalBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  blockName: { fontSize: 16, fontWeight: "600" },
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
  modalContent: { width: "90%", padding: 16, borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, marginBottom: 12 },
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
