import React, { useEffect, useState, useCallback } from "react";
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
// Si usas react-navigation, puedes refrescar al volver:
// import { useFocusEffect } from "@react-navigation/native";

interface Session {
  id?: number;
  date: string;
  notes?: string;
  completed?: boolean; // Usamos esto para decidir la etiqueta del botón
}

export default function SessionsScreen() {
  const router = useRouter();
  const { blockId } = useLocalSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);

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

  // Opcional: refrescar al volver a esta screen
  // useFocusEffect(
  //   useCallback(() => {
  //     fetchSessions();
  //   }, [])
  // );

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
        { headers: { Authorization: `Bearer ${token}` } }
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

  // "Comenzar sesión": marca completada y navega
  const startSession = async (id: number) => {
    try {
      setStartingId(id);
      const token = await getToken("accessToken");
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/sessions/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Si "comenzar" no debería marcar completada, cambia a { started: true }
        body: JSON.stringify({ started: true, completed: true }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      // Actualización optimista para que al volver se vea "Ver sesión"
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, completed: true } : s))
      );

      // Navega a la sesión
      router.push(`/fit/${blockId}/${id}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo comenzar la sesión.");
    } finally {
      setStartingId(null);
    }
  };

  // "Ver sesión": solo navegar
  const viewSession = (id: number) => {
    router.push(`/fit/${blockId}/${id}`);
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
        {/* Back */}
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
            // CARD sin onPress: NO navega al tocar el contenedor
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              ]}
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
                  marginTop: 6,
                }}
              >
                Sesión completada: {item.completed ? "Sí" : "No"}
              </Text>

              {/* Botón para atleta SIEMPRE visible.
                  - Si NO está completada => "Comenzar sesión"
                  - Si ya está completada => "Ver sesión" */}
              {role === "athlete" && !!item.id && (
                <TouchableOpacity
                  onPress={() =>
                    item.completed ? viewSession(item.id!) : startSession(item.id!)
                  }
                  disabled={startingId === item.id}
                  style={[
                    styles.sessionBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: startingId === item.id ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={styles.sessionBtnText}>
                    {startingId === item.id
                      ? "Iniciando..."
                      : item.completed
                      ? "Ver sesión"
                      : "Comenzar sesión"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Acciones de coach (sin cambios) */}
              {role === "coach" && (
                <View className="buttonsRow" style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: "#555", flex: 1, marginRight: 8 },
                    ]}
                    onPress={() => setCurrentSession(item)}
                  >
                    <Text style={styles.modalBtnText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Alert.alert(
                        "Confirmar eliminación",
                        `¿Eliminar la sesión "${item.date}"?`,
                        [
                          { text: "Cancelar", style: "cancel" },
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
            </View>
          )}
        />
      </ScrollView>

      {/* Modal CRUD sesiones */}
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

  // Botón acción (comenzar / ver)
  sessionBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  sessionBtnText: { color: "#fff", fontWeight: "bold" },
});
