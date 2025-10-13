import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getUserProfile } from "../../../services/userService";
import { deleteToken, getToken } from "../../../services/secureStore";
import { createInvitation } from "../../../services/invitationService";
import BottomNav from "../../components/bottomNav";

// ⬇️ NUEVO: importa el widget
import AIChatWidget from "../../components/AIChatWidget";

const { width } = Dimensions.get("window");

interface UserProfile {
  first_name?: string;
  second_name?: string | null;
  last_name?: string;
  second_last_name?: string | null;
  email: string;
  role: "ATHLETE" | "COACH" | string;
  coach?: { coach?: { email?: string } };
  athletes?: {
    id: number;
    athlete_name: string;
    athlete_email: string;
  }[];
}

const HomeScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [athleteEmail, setAthleteEmail] = useState<string>("");
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      await deleteToken("accessToken");
      await deleteToken("refreshToken");
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const token = await getToken("accessToken");
      if (!token) throw new Error("Token no disponible");

      const payload = athleteEmail.trim() ? athleteEmail.trim() : undefined;

      const result = await createInvitation(token, payload);
      Alert.alert("Código generado", `El código es: ${result.code}`);
      setAthleteEmail("");
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.athlete) {
        Alert.alert("Error", error.response.data.athlete);
      } else if (error.response?.data?.detail) {
        Alert.alert("Error", error.response.data.detail);
      } else {
        Alert.alert("Error", "No se pudo generar la invitación");
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EF233C" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#fff" }}>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.heroName}>{profile.first_name || profile.email}</Text>
          <Text style={styles.heroSubtitle}>
            ¿Listo para tus metas? ¡Haz que hoy cuente!
          </Text>
        </View>

        {/* Coach Panel primero */}
        {profile.role.toUpperCase() === "COACH" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis Atletas</Text>
            {profile.athletes?.map((a) => (
              <View key={a.id} style={styles.block}>
                <Ionicons name="person-circle-outline" size={22} color="#EF233C" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.blockText}>{a.athlete_name}</Text>
                  <Text style={styles.blockInfo}>{a.athlete_email}</Text>
                </View>
              </View>
            ))}

            <TextInput
              style={styles.input}
              placeholder="Correo del atleta (opcional)"
              placeholderTextColor="#777"
              value={athleteEmail}
              onChangeText={setAthleteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.generateButton} onPress={handleGenerateCode}>
              <Text style={styles.generateButtonText}>Generar Código</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Athlete Panel */}
        {profile.role.toUpperCase() === "ATHLETE" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mi Progreso</Text>

            {/* Quick Stats dentro de Mi Progreso */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="flame" size={28} color="#EF233C" />
                <View style={{ marginLeft: 16 }}>
                  <Text style={styles.cardValue}>12</Text>
                  <Text style={styles.cardLabel}>Días streak</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="barbell" size={28} color="#EF233C" />
                <View style={{ marginLeft: 16 }}>
                  <Text style={styles.cardValue}>4</Text>
                  <Text style={styles.cardLabel}>Workouts esta semana</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="calendar" size={28} color="#EF233C" />
                <View style={{ marginLeft: 16 }}>
                  <Text style={styles.cardValue}>Upper Body</Text>
                  <Text style={styles.cardLabel}>Próximo workout</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>Ver todo →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityItem}>
            <Text style={styles.activityTitle}>Deadlift PR</Text>
            <Text style={styles.activityDesc}>Nuevo récord personal: 495 lbs</Text>
            <Text style={styles.activityDate}>Hace 2 días</Text>
          </View>

          <View style={styles.activityItem}>
            <Text style={styles.activityTitle}>Leg Day</Text>
            <Text style={styles.activityDesc}>5 ejercicios, 45 minutos completados</Text>
            <Text style={styles.activityDate}>Hace 3 días</Text>
          </View>
        </View>

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationTitle}>Keep Pushing</Text>
          <Text style={styles.motivationQuote}>
            "The iron never lies to you. The iron will always kick you the real deal."
          </Text>
          <Text style={styles.motivationAuthor}>— Henry Rollins</Text>
        </View>
      </ScrollView>

      {/* burbuja de chat IA */}
      <AIChatWidget
        userName={profile.first_name || profile.email}
        role={profile.role}
      />

      <BottomNav />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" },

  // Hero
  hero: {
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
  },
  greeting: { fontSize: 18, color: "#aaa" },
  heroName: { fontSize: 32, fontWeight: "bold", marginTop: 5, color: "#fff" },
  heroSubtitle: { fontSize: 16, marginTop: 8, color: "#aaa" },

  // Stats
  statsContainer: {
    marginTop: 15,
    flexDirection: "column",
    gap: 15,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    elevation: 2,
    marginBottom: 10,
    width: width - 40,
  },
  cardValue: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  cardLabel: { fontSize: 14, color: "#aaa", marginTop: 4 },

  // Sections
  section: { marginHorizontal: 20, marginVertical: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#fff" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  viewAll: { color: "#EF233C", fontWeight: "600" },

  // Blocks (athletes)
  block: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  blockText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  blockInfo: { fontSize: 14, color: "#aaa" },

  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    marginTop: 10,
    backgroundColor: "#1E1E1E",
    color: "#fff",
  },

  generateButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  generateButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  // Activity
  activityItem: {
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  activityTitle: { fontWeight: "600", fontSize: 16, color: "#fff" },
  activityDesc: { fontSize: 14, color: "#aaa", marginTop: 3 },
  activityDate: { fontSize: 12, color: "#777", marginTop: 3 },

  // Motivation
  motivationCard: {
    backgroundColor: "#1E1E1E",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EF233C",
    marginBottom: 40,
  },
  motivationTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  motivationQuote: { fontSize: 14, fontStyle: "italic", marginVertical: 10, color: "#aaa" },
  motivationAuthor: { fontSize: 13, fontWeight: "600", color: "#EF233C" },
});
