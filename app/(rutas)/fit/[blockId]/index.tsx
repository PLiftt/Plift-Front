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
} from "react-native";
import PullToRefresh from "../../../components/PullToRefresh";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getToken } from "services/secureStore";
import { getUserProfile } from "services/userService";
import { API_URL } from "@env";
import { ArrowLeft } from "lucide-react-native";
import { useAppContext } from "app/context/appContext";

interface Session {
  id?: number;
  date: string;
  notes?: string;
  status?: "pending" | "in_progress" | "completed";
}

export default function SessionsScreen() {
  const router = useRouter();
  const { blockId } = useLocalSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);

  const { isDarkMode, language } = useAppContext();

  // 🎨 Paleta por tema (solo estilos, no cambia lógica)
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
        neutral: "#9CA3AF",
        overlay: "rgba(0,0,0,0.6)",
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
        neutral: "#6B7280",
        overlay: "rgba(0,0,0,0.25)",
      };

  // 🗣️ Textos
  const T = {
    title:
      language === "es"
        ? `Sesiones del bloque ${blockId}`
        : `Block ${blockId} sessions`,
    add: language === "es" ? "+ Añadir sesión" : "+ Add session",
    listLabel: language === "es" ? "Sesiones" : "Sessions",
    datePh: language === "es" ? "Fecha YYYY-MM-DD" : "Date YYYY-MM-DD",
    notesPh: language === "es" ? "Notas" : "Notes",
    cancel: language === "es" ? "Cancelar" : "Cancel",
    save: language === "es" ? "Guardar" : "Save",
    edit: language === "es" ? "Editar" : "Edit",
    del: language === "es" ? "Eliminar" : "Delete",
    confirmDel:
      language === "es" ? "Confirmar eliminación" : "Confirm deletion",
    confirmDelMsg: (d: string) =>
      language === "es"
        ? `¿Eliminar la sesión "${d}"?`
        : `Delete session "${d}"?`,
    status: language === "es" ? "Estado" : "Status",
    pending: language === "es" ? "Pendiente" : "Pending",
    inProgress: language === "es" ? "En progreso" : "In progress",
    completed: language === "es" ? "Finalizada" : "Completed",
    start: language === "es" ? "Comenzar sesión" : "Start session",
    starting: language === "es" ? "Iniciando..." : "Starting...",
    view: language === "es" ? "Ver sesión" : "View session",
    finish: language === "es" ? "Finalizar sesión" : "Finish session",
    confirmFinish: language === "es" ? "Finalizar sesión" : "Finish session",
    confirmFinishMsg:
      language === "es"
        ? "¿Seguro que deseas marcar esta sesión como completada?"
        : "Are you sure you want to mark this session as completed?",
    errLoad:
      language === "es"
        ? "No se pudieron cargar las sesiones"
        : "Could not load sessions",
    errSave:
      language === "es"
        ? "No se pudo guardar la sesión"
        : "Could not save the session",
    errDelete:
      language === "es"
        ? "No se pudo eliminar la sesión"
        : "Could not delete the session",
    errStart:
      language === "es"
        ? "No se pudo comenzar la sesión."
        : "Could not start the session.",
    errFinish:
      language === "es"
        ? "No se pudo finalizar la sesión."
        : "Could not finish the session.",
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

      // ✅ Orden personalizado
      const statusOrder = { in_progress: 1, pending: 2, completed: 3 };
      const sortedData = data.sort((a: Session, b: Session) => {
        const orderA = statusOrder[a.status || "pending"];
        const orderB = statusOrder[b.status || "pending"];
        if (orderA === orderB) {
          // si tienen el mismo estado, ordenar por fecha descendente
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return orderA - orderB;
      });

      setSessions(sortedData);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", T.errLoad);
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
      Alert.alert("Error", T.errSave);
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
      Alert.alert("Error", T.errDelete);
    }
  };

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
        body: JSON.stringify({ status: "in_progress" }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "in_progress" } : s))
      );
      router.push(`/fit/${blockId}/${id}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", T.errStart);
    } finally {
      setStartingId(null);
    }
  };

  const confirmFinishSession = (id: number) => {
    Alert.alert(T.confirmFinish, T.confirmFinishMsg, [
      { text: T.cancel, style: "cancel" },
      {
        text: T.finish,
        style: "destructive",
        onPress: () => finishSession(id),
      },
    ]);
  };

  const finishSession = async (id: number) => {
    try {
      setStartingId(id);
      const token = await getToken("accessToken");
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/sessions/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "completed" } : s))
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", T.errFinish);
    } finally {
      setStartingId(null);
    }
  };

  const viewSession = (id: number) => {
    router.push(`/fit/${blockId}/${id}`);
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <PullToRefresh
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchSessions}
      >
        <TouchableOpacity style={{ padding: 16 }} onPress={() => router.back()}>
          <ArrowLeft size={24} color={palette.text} />
        </TouchableOpacity>

        <Text
          style={[styles.title, { color: palette.text, textAlign: "center" }]}
        >
          {T.title}
        </Text>

        {role === "coach" && (
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: isDarkMode ? "#3F3F46" : "#374151" },
            ]}
            onPress={() => setCurrentSession({ date: "", notes: "" })}
          >
            <Text style={styles.addButtonText}>{T.add}</Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: palette.subtext, fontSize: 12, marginBottom: 4 }}>
          {T.listLabel}
        </Text>

        <FlatList
          data={sessions}
          keyExtractor={(item, index) =>
            item?.id ? item.id!.toString() : index.toString()
          }
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.accent,
                  borderWidth: 2,
                },
              ]}
            >
              <Text style={[styles.blockName, { color: palette.text }]}>
                {language === "es" ? "Sesión" : "Session"}: {item.date}
              </Text>
              <Text style={{ color: palette.text }}>
                {language === "es" ? "Notas" : "Notes"}: {item.notes || "-"}
              </Text>

              <Text
                style={{
                  color:
                    item.status === "completed"
                      ? palette.success
                      : item.status === "in_progress"
                      ? palette.warn
                      : palette.neutral,
                  fontWeight: "600",
                  marginTop: 6,
                }}
              >
                {T.status}:{" "}
                {item.status === "pending"
                  ? T.pending
                  : item.status === "in_progress"
                  ? T.inProgress
                  : T.completed}
              </Text>

              {role === "athlete" && !!item.id && (
                <View style={{ marginTop: 8 }}>
                  {item.status === "pending" && (
                    <TouchableOpacity
                      onPress={() => startSession(item.id!)}
                      disabled={startingId === item.id}
                      style={[
                        styles.sessionBtn,
                        {
                          backgroundColor: palette.accent,
                          opacity: startingId === item.id ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.sessionBtnText}>
                        {startingId === item.id ? T.starting : T.start}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {(item.status === "in_progress" ||
                    item.status === "completed") && (
                    <TouchableOpacity
                      onPress={() => viewSession(item.id!)}
                      style={[
                        styles.sessionBtn,
                        { backgroundColor: palette.accent, marginTop: 6 },
                      ]}
                    >
                      <Text style={styles.sessionBtnText}>{T.view}</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === "in_progress" && (
                    <TouchableOpacity
                      onPress={() => confirmFinishSession(item.id!)}
                      disabled={startingId === item.id}
                      style={[
                        styles.sessionBtn,
                        {
                          backgroundColor: palette.accent,
                          marginTop: 6,
                          opacity: startingId === item.id ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.sessionBtnText}>{T.finish}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {role === "coach" && (
                <View style={[styles.buttonsRow, { flexWrap: "wrap" }]}>
                  {/* Ver sesión */}
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor: palette.accent,
                        flex: 1,
                        marginRight: 8,
                      },
                    ]}
                    onPress={() => viewSession(item.id!)}
                  >
                    <Text style={styles.modalBtnText}>{T.view}</Text>
                  </TouchableOpacity>

                  {/* Editar sesión */}
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor: isDarkMode ? "#3F3F46" : "#374151",
                        flex: 1,
                        marginRight: 8,
                      },
                    ]}
                    onPress={() =>
                      item.status !== "completed" && setCurrentSession(item)
                    }
                    disabled={item.status === "completed"}
                  >
                    <Text style={styles.modalBtnText}>{T.edit}</Text>
                  </TouchableOpacity>

                  {/* Eliminar sesión */}
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: palette.accent, flex: 1 },
                    ]}
                    onPress={() => {
                      Alert.alert(T.confirmDel, T.confirmDelMsg(item.date), [
                        { text: T.cancel, style: "cancel" },
                        {
                          text: T.del,
                          style: "destructive",
                          onPress: () => deleteSession(item.id!),
                        },
                      ]);
                    }}
                  >
                    <Text style={styles.modalBtnText}>{T.del}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      </PullToRefresh>

      {/* Modal CRUD sesiones */}
      <Modal visible={!!currentSession} animationType="slide" transparent>
        <View
          style={[styles.modalBackground, { backgroundColor: palette.overlay }]}
        >
          <View
            style={[styles.modalContent, { backgroundColor: palette.surface }]}
          >
            <Text style={[styles.modalTitle, { color: palette.text }]}>
              {currentSession?.id
                ? language === "es"
                  ? "Editar Sesión"
                  : "Edit Session"
                : language === "es"
                ? "Agregar Sesión"
                : "Add Session"}
            </Text>
            <TextInput
              placeholder={T.datePh}
              placeholderTextColor={palette.subtext}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: palette.border,
                  backgroundColor: palette.surfaceAlt,
                },
              ]}
              value={currentSession?.date}
              onChangeText={(text) =>
                setCurrentSession((prev) =>
                  prev ? { ...prev, date: text } : null
                )
              }
            />
            <TextInput
              placeholder={T.notesPh}
              placeholderTextColor={palette.subtext}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: palette.border,
                  backgroundColor: palette.surfaceAlt,
                },
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
                  {
                    backgroundColor: isDarkMode ? "#3F3F46" : "#374151",
                    flex: 1,
                    marginRight: 8,
                  },
                ]}
                onPress={() => setCurrentSession(null)}
              >
                <Text style={styles.modalBtnText}>{T.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: palette.accent, flex: 1 },
                ]}
                onPress={saveSession}
              >
                <Text style={styles.modalBtnText}>{T.save}</Text>
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
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center" },
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
