import React, { useEffect, useState } from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getUserProfile } from "services/userService";
import { getBlocks, getSessions, getExercises } from "services/trainingService";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AthleteHistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [athletes, setAthletes] = useState<any[]>([]);

  useEffect(() => {
    fetchRole();
  }, []);

  useEffect(() => {
    if (role) fetchHistory();
  }, [role]);

  const fetchRole = async () => {
    const user = await getUserProfile();
    setRole(user.role?.toLowerCase());
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const blocksData = await getBlocks();

      if (role === "coach") {
        const grouped: Record<string, any[]> = {};

        for (const block of blocksData) {
          const athleteName =
            block.athlete_name || block.athlete || "Sin nombre";
          if (!grouped[athleteName]) grouped[athleteName] = [];
          grouped[athleteName].push(block);
        }

        const athleteList = await Promise.all(
          Object.keys(grouped).map(async (athleteName) => {
            const blocks = grouped[athleteName];
            const blocksWithSessions = await Promise.all(
              blocks.map(async (block: any) => {
                const sessions = await getSessions(block.id);
                const completedSessions = sessions.filter(
                  (s: any) => s.status === "completed" || s.completed
                );
                const sessionsWithExercises = await Promise.all(
                  completedSessions.map(async (session: any) => {
                    const exercises = await getExercises(session.id);
                    const completedExercises = exercises.filter(
                      (ex: any) => ex.status === "completed" || ex.completed
                    );
                    return { ...session, exercises: completedExercises };
                  })
                );
                return { ...block, sessions: sessionsWithExercises };
              })
            );
            return {
              name: athleteName,
              history: blocksWithSessions.filter((b) => b.sessions.length > 0),
            };
          })
        );

        setAthletes(athleteList);
      } else {
        const completedBlocks = blocksData.filter(
          (block: any) => block.status === "completed" || block.completed
        );
        const blocksWithSessions = await Promise.all(
          completedBlocks.map(async (block: any) => {
            const sessions = await getSessions(block.id);
            const completedSessions = sessions.filter(
              (s: any) => s.status === "completed" || s.completed
            );
            const sessionsWithExercises = await Promise.all(
              completedSessions.map(async (session: any) => {
                const exercises = await getExercises(session.id);
                const completedExercises = exercises.filter(
                  (ex: any) => ex.status === "completed" || ex.completed
                );
                return { ...session, exercises: completedExercises };
              })
            );
            return { ...block, sessions: sessionsWithExercises };
          })
        );
        setAthletes([{ name: "Tu historial", history: blocksWithSessions }]);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = (blockId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBlock(expandedBlock === blockId ? null : blockId);
    setExpandedSession(null);
  };

  const toggleSession = (sessionId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header con flecha */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {athletes.length === 0 ? (
          <Text style={styles.emptyText}>No hay historial disponible.</Text>
        ) : (
          athletes.map((athlete, index) => (
            <View key={index} style={styles.athleteContainer}>
              <View style={styles.athleteHeader}>
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color="#FF3B30"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.athleteName}>{athlete.name}</Text>
              </View>

              {athlete.history.length === 0 ? (
                <View style={styles.noHistoryContainer}>
                  <Text style={styles.noHistoryText}>
                    Ningún entrenamiento registrado
                  </Text>
                </View>
              ) : (
                athlete.history.map((block: any) => (
                  <View key={block.id} style={styles.blockCard}>
                    <TouchableOpacity
                      onPress={() => toggleBlock(block.id)}
                      style={styles.blockHeader}
                    >
                      <Ionicons
                        name="barbell-outline"
                        size={20}
                        color="#FF3B30"
                        style={{ marginRight: 8 }}
                      />
                      <View>
                        <Text style={styles.blockTitle}>
                          {block.name || `Bloque ${block.id}`}
                        </Text>
                        <Text style={styles.subtitle}>
                          {block.sessions.length} sesiones completadas
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {expandedBlock === block.id && (
                      <View style={styles.sectionContent}>
                        {block.sessions.map((session: any) => (
                          <View key={session.id} style={styles.sessionCard}>
                            <TouchableOpacity
                              onPress={() => toggleSession(session.id)}
                              style={styles.sessionHeader}
                            >
                              <Ionicons
                                name="flame-outline"
                                size={18}
                                color="#FF3B30"
                                style={{ marginRight: 6 }}
                              />
                              <View>
                                <Text style={styles.sessionTitle}>
                                  Sesión: {session.notes || "-"}
                                </Text>
                                <Text style={styles.subtitle}>
                                  Fecha: {session.date || "-"}
                                </Text>
                                <Text style={styles.subtitle}>
                                  {session.exercises.length} ejercicios
                                  completados
                                </Text>
                              </View>
                            </TouchableOpacity>

                            {expandedSession === session.id && (
                              <View style={styles.exerciseList}>
                                {session.exercises.map((ex: any) => (
                                  <View key={ex.id} style={styles.exerciseItem}>
                                    <Text style={styles.exerciseName}>
                                      {ex.name}
                                    </Text>
                                    <Text style={styles.exerciseDetail}>
                                      {ex.sets}x{ex.reps} | Peso propuesto:{" "}
                                      {ex.weight} kg | RPE Objetivo: @{ex.rpe}{" "}
                                      {"\n"}Peso realizado:{" "}
                                      {ex.weight_actual || "-"} kg | RPE
                                      Realizado: @{ex.rpe_actual}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    elevation: 0,
    shadowColor: "transparent",
  },
  backButton: { marginRight: 10 },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  container: { flex: 1, padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  emptyText: { textAlign: "center", marginTop: 20, color: "#ccc" },
  athleteContainer: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: "#0A0A0A",
  },
  athleteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  noHistoryContainer: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  noHistoryText: {
    color: "#ccc",
    fontSize: 14,
    fontStyle: "italic",
  },
  athleteName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  blockCard: {
    backgroundColor: "#121212",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  blockHeader: { flexDirection: "row", alignItems: "center" },
  blockTitle: { fontSize: 17, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 13, color: "#aaa", marginTop: 2 },
  sectionContent: { marginTop: 10 },
  sessionCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  sessionHeader: { flexDirection: "row", alignItems: "center" },
  sessionTitle: { fontSize: 15, fontWeight: "600", color: "#fff" },
  exerciseList: { marginTop: 8 },
  exerciseItem: {
    backgroundColor: "#0E0E0E",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  exerciseName: { fontSize: 14, fontWeight: "500", color: "#fff" },
  exerciseDetail: { fontSize: 12, color: "#ccc" },
});
