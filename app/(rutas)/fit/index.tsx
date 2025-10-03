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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { getToken } from "services/secureStore";
import { getUserProfile } from "services/userService";
import { API_URL } from "@env";
import BottomNav from "../../components/bottomNav";

interface Block {
  id?: number;
  name: string;
  periodization: string;
  start_date: string;
  end_date: string;
  goal_competition_date?: string;
  athlete?: number;
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
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);

  const colors = {
    background: "#000",
    cardBackground: "#111",
    primary: "#EF233C",
    secondary: "#4CAF50",
    textPrimary: "#fff",
    muted: "#888",
  };

  useEffect(() => {
    fetchRoleAndAthletes();
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
      Alert.alert("Error", "No se pudo cargar perfil y atletas");
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
      Alert.alert("Error", "No se pudieron cargar los bloques");
    } finally {
      setLoading(false);
    }
  };

  const saveBlock = async () => {
    if (!currentBlock) return;
    if (!currentBlock.name || !currentBlock.start_date || !currentBlock.end_date) {
      Alert.alert("Error", "Debes completar todos los campos obligatorios");
      return;
    }
    if (role === "coach" && !selectedAthleteId) {
      Alert.alert("Error", "Debes seleccionar un atleta");
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
      setModalVisible(false);
      setCurrentBlock(null);
      setSelectedAthleteId(null);
      fetchBlocks();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo guardar el bloque");
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
      Alert.alert("Error", "No se pudo eliminar el bloque");
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
        <Text style={[styles.title, { color: colors.textPrimary, textAlign: "center" }]}>
          Bloques de entrenamiento
        </Text>

        {role === "coach" && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#555" }]}
            onPress={() => {
              setCurrentBlock({ name: "", periodization: "LINEAL", start_date: "", end_date: "" });
              setSelectedAthleteId(null);
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>+ Añadir bloque</Text>
          </TouchableOpacity>
        )}

        <View style={{ flexGrow: 1 }}>
          <FlatList
            data={blocks}
            keyExtractor={(item, index) => (item?.id ? item.id!.toString() : index.toString())}
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
                onPress={() => router.push(`/fit/${item.id}`)}
                activeOpacity={0.8}
              >
                <Text style={[styles.blockName, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={{ color: colors.muted }}>Periodo: {item.periodization}</Text>
                <Text style={{ color: colors.muted }}>
                  Inicio: {item.start_date} | Fin: {item.end_date}
                </Text>
                {item.athlete && <Text style={{ color: colors.muted }}>Atleta ID: {item.athlete}</Text>}
                {role === "coach" && (
                  <View style={styles.buttonsRow}>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: "#555" }]}
                      onPress={() => {
                        setCurrentBlock(item);
                        setSelectedAthleteId(item.athlete || null);
                        setModalVisible(true);
                      }}
                    >
                      <Text style={styles.modalBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                      onPress={() => deleteBlock(item.id!)}
                    >
                      <Text style={styles.modalBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {currentBlock?.id ? "Editar" : "Agregar"} Bloque
            </Text>

            {/* Inputs */}
            <TextInput
              placeholder="Nombre"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
              value={currentBlock?.name}
              onChangeText={(text) => setCurrentBlock((prev) => (prev ? { ...prev, name: text } : null))}
            />
            <TextInput
              placeholder="Periodización (LINEAL, DUP, BLOQUES)"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
              value={currentBlock?.periodization}
              onChangeText={(text) => setCurrentBlock((prev) => (prev ? { ...prev, periodization: text } : null))}
            />
            <TextInput
              placeholder="Fecha inicio YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
              value={currentBlock?.start_date}
              onChangeText={(text) => setCurrentBlock((prev) => (prev ? { ...prev, start_date: text } : null))}
            />
            <TextInput
              placeholder="Fecha fin YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
              value={currentBlock?.end_date}
              onChangeText={(text) => setCurrentBlock((prev) => (prev ? { ...prev, end_date: text } : null))}
            />
            <TextInput
              placeholder="Fecha objetivo YYYY-MM-DD (opcional)"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.muted }]}
              value={currentBlock?.goal_competition_date}
              onChangeText={(text) => setCurrentBlock((prev) => (prev ? { ...prev, goal_competition_date: text } : null))}
            />

            {/* Atletas */}
            {role === "coach" && athletes.length > 0 && (
              <>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>Atletas</Text>
                <FlatList
                  data={athletes}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.athleteItem,
                        {
                          borderColor: selectedAthleteId === item.id ? colors.primary : colors.muted,
                          backgroundColor: selectedAthleteId === item.id ? "#222" : "#111",
                        },
                      ]}
                      onPress={() => setSelectedAthleteId(item.id)}
                    >
                      <Text style={{ color: colors.textPrimary }}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#555" }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={saveBlock}>
                <Text style={styles.modalBtnText}>Guardar</Text>
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
  addButton: { marginBottom: 16, padding: 12, borderRadius: 8, alignItems: "center" },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  card: { padding: 16, marginBottom: 10, borderRadius: 8 },
  blockName: { fontSize: 16, fontWeight: "600" },
  buttonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000099" },
  modalContent: { width: "90%", padding: 16, borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, marginBottom: 12 },
  athleteItem: { padding: 10, marginVertical: 4, borderRadius: 6, borderWidth: 1 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  modalBtn: { flex: 1, marginHorizontal: 5, padding: 12, borderRadius: 6, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "bold" },
});
