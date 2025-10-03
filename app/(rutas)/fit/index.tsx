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
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getToken } from "services/secureStore";
import { getUserProfile } from "services/userService";
import { API_URL } from "@env";

interface Block {
  id?: number;
  name: string;
  periodization: string;
  start_date: string;
  end_date: string;
  goal_competition_date?: string;
  athlete?: number; // ID real del atleta
}

interface Athlete {
  id: number; // ID real
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

  useEffect(() => {
    fetchRoleAndAthletes();
  }, []);

  const fetchRoleAndAthletes = async () => {
    try {
      const profile = await getUserProfile();
      setRole(profile.role.toLowerCase());

      if (profile.role.toLowerCase() === "coach" && profile.athletes) {
        const mapped: Athlete[] = profile.athletes.map((a: any) => ({
          id: a.athlete, // ✅ ID real del atleta
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

    if (
      !currentBlock.name ||
      !currentBlock.start_date ||
      !currentBlock.end_date
    ) {
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
      start_date: currentBlock.start_date || null,
      end_date: currentBlock.end_date || null,
      goal_competition_date: currentBlock.goal_competition_date || null,
    };

    if (role === "coach") {
      payload.athlete = selectedAthleteId; // ✅ ID real
    }

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
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bloques de entrenamiento</Text>

      {role === "coach" && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setCurrentBlock({
              name: "",
              periodization: "LINEAL",
              start_date: "",
              end_date: "",
            });
            setSelectedAthleteId(null);
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Añadir bloque</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={blocks}
        keyExtractor={(item, index) =>
          item?.id ? item.id!.toString() : index.toString()
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/fit/${item.id}`)}
          >
            <Text style={styles.blockName}>{item.name}</Text>
            <Text>Periodo: {item.periodization}</Text>
            <Text>
              Inicio: {item.start_date} | Fin: {item.end_date}
            </Text>
            {item.athlete && <Text>Atleta ID: {item.athlete}</Text>}
            {role === "coach" && (
              <View style={styles.buttonsRow}>
                <Button
                  title="Editar"
                  onPress={() => {
                    setCurrentBlock(item);
                    setSelectedAthleteId(item.athlete || null); // ✅ ID real
                    setModalVisible(true);
                  }}
                />
                <Button
                  title="Eliminar"
                  color="red"
                  onPress={() => deleteBlock(item.id!)}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentBlock?.id ? "Editar" : "Agregar"} Bloque
            </Text>

            <TextInput
              placeholder="Nombre"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={currentBlock?.name}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, name: text } : null
                )
              }
            />

            <TextInput
              placeholder="Periodización (LINEAL, DUP, BLOQUES)"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={currentBlock?.periodization}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, periodization: text } : null
                )
              }
            />

            <TextInput
              placeholder="Fecha inicio YYYY-MM-DD"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={currentBlock?.start_date}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, start_date: text } : null
                )
              }
            />

            <TextInput
              placeholder="Fecha fin YYYY-MM-DD"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={currentBlock?.end_date}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, end_date: text } : null
                )
              }
            />

            <TextInput
              placeholder="Fecha objetivo YYYY-MM-DD (opcional)"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={currentBlock?.goal_competition_date}
              onChangeText={(text) =>
                setCurrentBlock((prev) =>
                  prev ? { ...prev, goal_competition_date: text } : null
                )
              }
            />

            {/* Lista de atletas solo para coach */}
            {role === "coach" && athletes.length > 0 && (
              <FlatList
                data={athletes}
                keyExtractor={(item) => item.id.toString()} // ✅ ID real
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.athleteItem,
                      selectedAthleteId === item.id && styles.athleteSelected,
                    ]}
                    onPress={() => setSelectedAthleteId(item.id)} // ✅ ID real
                  >
                    <Text style={styles.athleteName}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#555" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#d32f2f" }]}
                onPress={saveBlock}
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
    color: "#000",
  },
  athleteItem: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#111",
  },
  athleteSelected: {
    borderColor: "#d32f2f",
    backgroundColor: "#222",
  },
  athleteName: {
    color: "#fff",
    fontSize: 14,
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
  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
