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
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⬇️ Burbuja de chat IA
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

  // ----- BLOQUE VISUAL SIN DATOS REALES (con persistencia) -----
  const challenges = [
    "3×10 face pulls + 60s plancha",
    "10′ movilidad cadera + 2×15 buenos días con banda",
    "Paseos del granjero 4×30m (barras o mancuernas)",
    "5′ respiración nasal + 5′ caminata ligera",
    "TCAs 2× (bird dog, dead bug, side plank) 30s c/u",
    "Saltos suaves 3×10 + estiramiento pantorrillas",
    "Hip thrust isométrico 3×20s + 2×12 puente glúteo",
  ];

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10); // AAAA-MM-DD
  const deterministicIndex =
    [...todayKey].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % challenges.length;
  const deterministicChallenge = challenges[deterministicIndex];

  // Desafío elegido (persistente por día)
  const CHALLENGE_KEY = `challenge:${todayKey}`;
  const CHALLENGE_DONE_KEY = `challenge_done:${todayKey}`;
  const [challenge, setChallenge] = useState<string>(deterministicChallenge);
  const [challengeDone, setChallengeDone] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [saved, savedDone] = await Promise.all([
          AsyncStorage.getItem(CHALLENGE_KEY),
          AsyncStorage.getItem(CHALLENGE_DONE_KEY),
        ]);
        if (saved && challenges.includes(saved)) setChallenge(saved);
        if (savedDone) setChallengeDone(savedDone === "1");
      } catch (e) {
        console.warn("No se pudo cargar desafío:", e);
      }
    })();
  }, [CHALLENGE_KEY, CHALLENGE_DONE_KEY]);

  const shuffleChallenge = async () => {
    try {
      let next = challenge;
      while (next === challenge) next = challenges[Math.floor(Math.random() * challenges.length)];
      setChallenge(next);
      setChallengeDone(false);
      await Promise.all([
        AsyncStorage.setItem(CHALLENGE_KEY, next),
        AsyncStorage.setItem(CHALLENGE_DONE_KEY, "0"),
      ]);
    } catch (e) {
      console.warn("No se pudo guardar el desafío:", e);
    }
  };

  const toggleChallengeDone = async () => {
    try {
      const next = !challengeDone;
      setChallengeDone(next);
      await AsyncStorage.setItem(CHALLENGE_DONE_KEY, next ? "1" : "0");
    } catch (e) {
      console.warn("No se pudo guardar estado del desafío:", e);
    }
  };

  // Hidratación (persistente por día)
  const HYDRATION_KEY = `hydration:${todayKey}`;
  const [cups, setCups] = useState<boolean[]>(Array(8).fill(false));

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HYDRATION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length === 8) setCups(parsed.map(Boolean));
        }
      } catch (e) {
        console.warn("No se pudo cargar hidratación local:", e);
      }
    })();
  }, [HYDRATION_KEY]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify(cups));
      } catch (e) {
        console.warn("No se pudo guardar hidratación local:", e);
      }
    })();
  }, [cups, HYDRATION_KEY]);

  const toggleCup = (i: number) => {
    setCups((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };
  const resetCups = async () => {
    const empty = Array(8).fill(false);
    setCups(empty);
    try {
      await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify(empty));
    } catch {}
  };
  const confirmResetCups = () => {
    Alert.alert(
      "Reiniciar hidratación",
      "¿Quieres vaciar los 8 vasos de hoy?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, reiniciar", style: "destructive", onPress: resetCups },
      ],
      { cancelable: true }
    );
  };

  const hydrationCount = cups.filter(Boolean).length;
  const hydrationPct = Math.round((hydrationCount / 8) * 100);
  // ----- FIN bloque visual -----

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
          <Text style={styles.heroSubtitle}>¿Listo para tus metas? ¡Haz que hoy cuente!</Text>
        </View>

        {/* Coach Panel */}
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
            {/* ⬇️ Header de MI PROGRESO con ícono (armonizado) */}
            <View style={[styles.sectionHeader, styles.headerGapLarge]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="stats-chart-outline" size={18} color="#EF233C" />
                <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>
                  Mi Progreso
                </Text>
              </View>
            </View>

            {/* Quick Stats */}
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

        {/* ----- REEMPLAZO ARMÓNICO: títulos fuera + más espacio ----- */}
        <View style={styles.section}>
          {/* Header "Desafío del día" con acciones (más espacio debajo) */}
          <View style={[styles.sectionHeader, styles.headerGapLarge]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="flag-outline" size={18} color="#EF233C" />
              <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>
                Desafío del día
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={shuffleChallenge} style={styles.altBtn}>
                <Text style={styles.altBtnText}>Otro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleChallengeDone}
                style={[styles.doneBtn, challengeDone && styles.doneBtnActive]}
              >
                <Ionicons
                  name={challengeDone ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={challengeDone ? "#121212" : "#aaa"}
                />
                <Text style={[styles.doneBtnText, challengeDone && { color: "#121212", fontWeight: "800" }]}>
                  {challengeDone ? "Hecho" : "Marcar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tarjeta del desafío */}
          <View style={styles.challengeCard}>
            <Text
              style={[
                styles.challengeText,
                challengeDone && { color: "#777", textDecorationLine: "line-through" },
              ]}
            >
              {challenge}
            </Text>
          </View>

          {/* Header "Hidratación" con contador + reset */}
          <View style={[styles.sectionHeader, styles.headerGap]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="water-outline" size={18} color="#EF233C" />
              <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>
                Hidratación
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ color: "#aaa", fontSize: 12 }}>
                {hydrationCount}/8 • {hydrationPct}%
              </Text>
              <TouchableOpacity onPress={confirmResetCups} style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tarjeta de hidratación */}
          <View style={styles.hydrationCard}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${hydrationPct}%` }]} />
            </View>

            <View style={styles.cupsRow}>
              {cups.map((filled, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => toggleCup(idx)}
                  style={[styles.cup, filled && styles.cupFilled]}
                >
                  <Ionicons name="water-outline" size={16} color={filled ? "#121212" : "#aaa"} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        {/* ----- FIN REEMPLAZO ----- */}
      </ScrollView>

      {/* burbuja de chat IA */}
      <AIChatWidget userName={profile.first_name || profile.email} role={profile.role} />

      <BottomNav />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  // Base
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
  statsContainer: { marginTop: 15, flexDirection: "column", gap: 15 },
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

  // Secciones / títulos
  section: { marginHorizontal: 20, marginVertical: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  // Pequeños ajustes de separación entre título y tarjeta
  headerGap: { marginBottom: 8 },
  headerGapLarge: { marginBottom: 12 },

  // Lista de atletas (COACH)
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

  // Desafío
  challengeCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 16,
    marginTop: 0,
    marginBottom: 12,
  },
  challengeText: { color: "#fff", fontSize: 16, lineHeight: 22 },

  // Botones header (Otro / Marcar)
  altBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#262626",
  },
  altBtnText: { color: "#EF233C", fontWeight: "700", fontSize: 12 },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#1A1A1A",
    gap: 6,
  },
  doneBtnActive: { backgroundColor: "#28a745", borderColor: "#28a745" },
  doneBtnText: { color: "#aaa", fontSize: 12, fontWeight: "700" },

  // Hidratación
  hydrationCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 16,
    marginTop: 0,
  },
  cupsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  cup: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#555",
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  cupFilled: { backgroundColor: "#EF233C", borderColor: "#EF233C" },

  // Barra de progreso
  progressTrack: {
    marginTop: 6,
    height: 8,
    backgroundColor: "#1A1A1A",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#262626",
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#EF233C", borderRadius: 99 },

  // Botón Reset
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#262626",
  },
  resetBtnText: {
    color: "#EF233C",
    fontWeight: "700",
    fontSize: 12,
  },
});
