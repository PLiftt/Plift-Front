// app/fit/index.tsx
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
import { useRouter } from "expo-router";
import { getToken } from "services/secureStore";
import { getUserProfile } from "services/userService";
import { API_URL } from "@env";
import BottomNav from "../../components/bottomNav";
import PullToRefresh from "../../components/PullToRefresh";
import { useAppContext } from "app/context/appContext";
import { triggerAthleteNotification } from "services/notificationService";
import { on, off, CoachEventPayload, emit } from "app/lib/eventBus";

interface Block {
  id?: number;
  name: string;
  periodization: string;
  start_date: string;
  end_date: string;
  goal_competition_date?: string;
  athlete?: number;
  completed?: boolean;
}

interface Athlete {
  id: number;
  label: string;
}

export default function BlocksScreen() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);

  const { isDarkMode, language } = useAppContext();

  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        surface: "#1E1E1E",
        surfaceAlt: "#111111",
        text: "#FFFFFF",
        subtext: "#9CA3AF",
        border: "#2A2A2A",
        accent: "#EF233C",
        success: "#28a745",
        warn: "#f59e0b",
        inputBorder: "#6B7280",
        overlay: "rgba(0,0,0,0.6)",
        chipOn: "#222222",
        chipOff: "#111111",
      }
    : {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceAlt: "#FFFFFF",
        text: "#111827",
        subtext: "#6B7280",
        border: "#E5E7EB",
        accent: "#EF233C",
        success: "#22c55e",
        warn: "#d97706",
        inputBorder: "#D1D5DB",
        overlay: "rgba(0,0,0,0.25)",
        chipOn: "#F3F4F6",
        chipOff: "#FFFFFF",
      };

  const T = {
    title: language === "es" ? "Bloques de entrenamiento" : "Training Blocks",
    addBlock: language === "es" ? "+ Añadir bloque" : "+ Add block",
    empty:
      language === "es"
        ? "Aún no tienes bloques de entrenamiento asignados"
        : "You don't have assigned training blocks yet",
    period: language === "es" ? "Periodo" : "Periodization",
    start: language === "es" ? "Inicio" : "Start",
    end: language === "es" ? "Fin" : "End",
    athleteId: language === "es" ? "Atleta ID" : "Athlete ID",
    completed: language === "es" ? "Bloque completado" : "Block completed",
    yes: language === "es" ? "Sí" : "Yes",
    no: language === "es" ? "No" : "No",
    edit: language === "es" ? "Editar" : "Edit",
    del: language === "es" ? "Eliminar" : "Delete",
    confirmDel:
      language === "es" ? "Confirmar eliminación" : "Confirm deletion",
    confirmDelMsg: (name: string) =>
      language === "es"
        ? `¿Estás seguro de que deseas eliminar el bloque "${name}"?`
        : `Are you sure you want to delete block "${name}"?`,
    modalTitleAdd: language === "es" ? "Agregar Bloque" : "Add Block",
    modalTitleEdit: language === "es" ? "Editar Bloque" : "Edit Block",
    namePh: language === "es" ? "Nombre" : "Name",
    periodPh:
      language === "es"
        ? "Periodización (LINEAL, DUP, BLOQUES)"
        : "Periodization (LINEAL, DUP, BLOCKS)",
    startPh:
      language === "es" ? "Fecha inicio YYYY-MM-DD" : "Start date YYYY-MM-DD",
    endPh: language === "es" ? "Fecha fin YYYY-MM-DD" : "End date YYYY-MM-DD",
    goalPh:
      language === "es"
        ? "Fecha objetivo YYYY-MM-DD (opcional)"
        : "Target date YYYY-MM-DD (optional)",
    athletes: language === "es" ? "Atletas" : "Athletes",
    cancel: language === "es" ? "Cancelar" : "Cancel",
    save: language === "es" ? "Guardar" : "Save",
    errProfile:
      language === "es"
        ? "No se pudo cargar perfil y atletas"
        : "Could not load profile and athletes",
    errLoadBlocks:
      language === "es"
        ? "No se pudieron cargar los bloques"
        : "Could not load blocks",
    errSave:
      language === "es"
        ? "No se pudo guardar el bloque"
        : "Could not save block",
    errDelete:
      language === "es"
        ? "No se pudo eliminar el bloque"
        : "Could not delete block",
    required:
      language === "es"
        ? "Debes completar todos los campos obligatorios"
        : "You must complete all required fields",
    needAthlete:
      language === "es"
        ? "Debes seleccionar un atleta"
        : "You must select an athlete",
  };

  useEffect(() => {
    fetchRoleAndAthletes();
  }, []);

  // Refresca la lista cuando llega una notificación de NEW_BLOCK
  useEffect(() => {
    const handler = (data: CoachEventPayload) => {
      if (data?.event === "NEW_BLOCK") {
        fetchBlocks();
      }
    };
    const unsubscribe = on("coach-event", handler);
    return () => {
      unsubscribe?.();
      off("coach-event", handler);
    };
  }, []);

  const fetchRoleAndAthletes = async () => {
    try {
      const profile = await getUserProfile();
      setRole(profile.role.toLowerCase());
      if (profile.role.toLowerCase() === "coach" && profile.athletes) {
        const mapped: Athlete[] = profile.athletes.map((a: any) => ({
          id: a.athlete,
          label: a.athlete_name,
        }));
        setAthletes(mapped);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", T.errProfile);
    } finally {
      fetchBlocks();
    }
  };

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const token = await getToken("accessToken");
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/blocks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBlocks(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", T.errLoadBlocks);
    } finally {
      setLoading(false);
    }
  };

  const saveBlock = async () => {
    if (!currentBlock) return;
    if (
      !currentBlock.name ||
      !currentBlock.start_date ||
      !currentBlock.end_date
    ) {
      Alert.alert("Error", T.required);
      return;
    }
    if (role === "coach" && !selectedAthleteId) {
      Alert.alert("Error", T.needAthlete);
      return;
    }

    const token = await getToken("accessToken");
    const payload: any = {
      name: currentBlock.name.trim(),
      periodization: currentBlock.periodization || "LINEAL",
      start_date: currentBlock.start_date,
      end_date: currentBlock.end_date,
      goal_competition_date: currentBlock.goal_competition_date || null,
    };
    if (role === "coach") payload.athlete = selectedAthleteId;

    let url = `${API_URL.replace(/\/$/, "")}/blocks/`;
    let method: "POST" | "PATCH" = "POST";
    if (currentBlock.id) {
      url += `${currentBlock.id}/`;
      method = "PATCH";
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("Error guardando bloque:", errData);
        Alert.alert("Error", JSON.stringify(errData));
        return;
      }

      await res.json().catch(() => null);

      // 💬 Ya no usamos emit() ni eventos duplicados
      // Solo recargamos una vez localmente
      await fetchBlocks();

      setModalVisible(false);
      setCurrentBlock(null);
      setSelectedAthleteId(null);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", T.errSave);
    }
  };

  const deleteBlock = async (id: number) => {
    const token = await getToken("accessToken");
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/blocks/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error eliminando bloque");
      fetchBlocks();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", T.errDelete);
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
      <PullToRefresh
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
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
            onPress={() => {
              setCurrentBlock({
                name: "",
                periodization: "",
                start_date: "",
                end_date: "",
              });
              setSelectedAthleteId(null);
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>{T.addBlock}</Text>
          </TouchableOpacity>
        )}

        <View style={{ flexGrow: 1 }}>
          {blocks.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                height: 300,
              }}
            >
              <Text
                style={{
                  color: palette.text,
                  fontSize: 16,
                  textAlign: "center",
                  top: 160,
                  paddingHorizontal: 20,
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
                {T.empty}
              </Text>
            </View>
          ) : (
            <FlatList
              data={blocks}
              keyExtractor={(item, index) =>
                item?.id ? item.id!.toString() : index.toString()
              }
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.accent,
                      borderWidth: 2,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDarkMode ? 0.35 : 0.08,
                      shadowRadius: 4,
                      elevation: 4,
                    },
                  ]}
                  onPress={() => router.push(`/fit/${item.id}`)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.blockName, { color: palette.text }]}>
                    {item.name}
                  </Text>
                  <Text style={{ color: palette.subtext }}>
                    {T.period}: {item.periodization}
                  </Text>
                  <Text style={{ color: palette.subtext }}>
                    {T.start}: {item.start_date} | {T.end}: {item.end_date}
                  </Text>
                  {!!item.athlete && (
                    <Text style={{ color: palette.subtext }}>
                      {T.athleteId}: {item.athlete}
                    </Text>
                  )}
                  <Text
                    style={{
                      color: item.completed ? palette.success : palette.warn,
                      fontWeight: "600",
                    }}
                  >
                    {T.completed}: {item.completed ? T.yes : T.no}
                  </Text>

                  {role === "coach" && (
                    <View style={styles.buttonsRow}>
                      <TouchableOpacity
                        style={[
                          styles.modalBtn,
                          {
                            backgroundColor: isDarkMode ? "#3F3F46" : "#374151",
                          },
                        ]}
                        onPress={() => {
                          setCurrentBlock(item);
                          setSelectedAthleteId(item.athlete || null);
                          setModalVisible(true);
                        }}
                      >
                        <Text style={styles.modalBtnText}>{T.edit}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalBtn,
                          { backgroundColor: palette.accent },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            T.confirmDel,
                            T.confirmDelMsg(item.name),
                            [
                              { text: T.cancel, style: "cancel" },
                              {
                                text: T.del,
                                style: "destructive",
                                onPress: () => deleteBlock(item.id!),
                              },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.modalBtnText}>{T.del}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </PullToRefresh>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View
          style={[styles.modalBackground, { backgroundColor: palette.overlay }]}
        >
          <View
            style={[styles.modalContent, { backgroundColor: palette.surface }]}
          >
            <Text style={[styles.modalTitle, { color: palette.text }]}>
              {currentBlock?.id ? T.modalTitleEdit : T.modalTitleAdd}
            </Text>

            {/* Inputs */}
            <TextInput
              placeholder={T.namePh}
              placeholderTextColor={palette.subtext}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: palette.inputBorder,
                  backgroundColor: palette.surfaceAlt,
                },
              ]}
              value={currentBlock?.name}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, name: text } : null
                )
              }
            />
            <TextInput
              placeholder={T.periodPh}
              placeholderTextColor={palette.subtext}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: palette.inputBorder,
                  backgroundColor: palette.surfaceAlt,
                },
              ]}
              value={currentBlock?.periodization}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, periodization: text } : null
                )
              }
            />
            <TextInput
              placeholder={T.startPh}
              placeholderTextColor={palette.subtext}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: palette.inputBorder,
                  backgroundColor: palette.surfaceAlt,
                },
              ]}
              value={currentBlock?.start_date}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, start_date: text } : null
                )
              }
            />
            <TextInput
              placeholder={T.endPh}
              placeholderTextColor={palette.subtext}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: palette.inputBorder,
                  backgroundColor: palette.surfaceAlt,
                },
              ]}
              value={currentBlock?.end_date}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, end_date: text } : null
                )
              }
            />
            <TextInput
              placeholder={T.goalPh}
              placeholderTextColor={palette.subtext}
              style={[
                styles.input,
                {
                  color: palette.text,
                  borderColor: palette.inputBorder,
                  backgroundColor: palette.surfaceAlt,
                },
              ]}
              value={currentBlock?.goal_competition_date}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, goal_competition_date: text } : null
                )
              }
            />

            {/* Atletas */}
            {role === "coach" && athletes.length > 0 && (
              <>
                <Text
                  style={{
                    color: palette.subtext,
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  {T.athletes}
                </Text>
                <FlatList
                  data={athletes}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.athleteItem,
                        {
                          borderColor:
                            selectedAthleteId === item.id
                              ? palette.accent
                              : palette.inputBorder,
                          backgroundColor:
                            selectedAthleteId === item.id
                              ? palette.chipOn
                              : palette.chipOff,
                        },
                      ]}
                      onPress={() => setSelectedAthleteId(item.id)}
                    >
                      <Text style={{ color: palette.text }}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: isDarkMode ? "#3F3F46" : "#374151" },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>{T.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: palette.accent }]}
                onPress={saveBlock}
              >
                <Text style={styles.modalBtnText}>{T.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, marginTop: 16 },
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
  athleteItem: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
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
