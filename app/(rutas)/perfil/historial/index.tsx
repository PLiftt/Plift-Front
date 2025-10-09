import React, { useEffect, useState } from "react";
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
        // Agrupar bloques por atleta
        const grouped: Record<string, any[]> = {};

        for (const block of blocksData) {
          const athleteName =
            block.athlete_name || block.athlete || "Sin nombre";
          if (!grouped[athleteName]) grouped[athleteName] = [];
          grouped[athleteName].push(block);
        }

        // Construir la estructura de atletas con su historial
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
        // Athlete normal: solo sus bloques
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {athletes.length === 0 ? (
        <Text style={styles.emptyText}>No hay historial disponible.</Text>
      ) : (
        athletes.map((athlete, index) => (
          <View key={index} style={{ marginBottom: 24 }}>
            {role === "coach" && (
              <Text style={styles.athleteName}>{athlete.name}</Text>
            )}

            {athlete.history.map((block: any) => (
              <View key={block.id} style={styles.blockCard}>
                <TouchableOpacity onPress={() => toggleBlock(block.id)}>
                  <Text style={styles.blockTitle}>
                    🏋️‍♂️ {block.name || `Bloque ${block.id}`}
                  </Text>
                  <Text style={styles.subtitle}>
                    {block.sessions.length} sesiones completadas
                  </Text>
                </TouchableOpacity>

                {expandedBlock === block.id && (
                  <View style={styles.sectionContent}>
                    {block.sessions.map((session: any) => (
                      <View key={session.id} style={styles.sessionCard}>
                        <TouchableOpacity
                          onPress={() => toggleSession(session.id)}
                        >
                          <Text style={styles.sessionTitle}>
                            Sesión: {session.notes || "-"}
                          </Text>
                          <Text style={styles.subtitle}>
                            {session.exercises.length} ejercicios completados
                          </Text>
                        </TouchableOpacity>

                        {expandedSession === session.id && (
                          <View style={styles.exerciseList}>
                            {session.exercises.map((ex: any) => (
                              <View key={ex.id} style={styles.exerciseItem}>
                                <Text style={styles.exerciseName}>
                                  {ex.name}
                                </Text>
                                <Text style={styles.exerciseDetail}>
                                  {ex.sets}x{ex.reps} | {ex.weight} kg | RPE{" "}
                                  {ex.rpe}
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
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#6B7280" },
  athleteName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1F2937",
  },
  blockCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  blockTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  sectionContent: { marginTop: 10 },
  sessionCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  sessionTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  exerciseList: { marginTop: 8 },
  exerciseItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  exerciseName: { fontSize: 15, fontWeight: "500", color: "#111827" },
  exerciseDetail: { fontSize: 13, color: "#4B5563" },
});
