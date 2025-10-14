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
import { useAppContext } from "app/context/appContext";

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
  const { isDarkMode, language } = useAppContext();

  // 🎨 Paleta por tema (solo estilos, no cambia lógica)
  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        surface: "#1E1E1E",
        surfaceAlt: "#1A1A1A",
        text: "#FFFFFF",
        subtext: "#AAAAAA",
        border: "#262626",
        borderSoft: "#2A2A2A",
        inputBg: "#1E1E1E",
        inputText: "#FFFFFF",
        inputBorder: "#333333",
        placeholder: "#777777",
        accent: "#EF233C",
        success: "#28a745",
        trackBg: "#1A1A1A",
        cupBorder: "#555555",
      }
    : {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceAlt: "#FFFFFF",
        text: "#111111",
        subtext: "#4B5563",
        border: "#E5E7EB",
        borderSoft: "#E5E7EB",
        inputBg: "#FFFFFF",
        inputText: "#111111",
        inputBorder: "#D1D5DB",
        placeholder: "#777777",
        accent: "#EF233C",
        success: "#22c55e",
        trackBg: "#E5E7EB",
        cupBorder: "#D1D5DB",
      };

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
      language === "es" ? "Reiniciar hidratación" : "Reset hydration",
      language === "es" ? "¿Quieres vaciar los 8 vasos de hoy?" : "Do you want to clear today's 8 cups?",
      [
        { text: language === "es" ? "Cancelar" : "Cancel", style: "cancel" },
        { text: language === "es" ? "Sí, reiniciar" : "Yes, reset", style: "destructive", onPress: resetCups },
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
      Alert.alert(
        language === "es" ? "Código generado" : "Code generated",
        (language === "es" ? "El código es: " : "Your code: ") + result.code
      );
      setAthleteEmail("");
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.athlete) {
        Alert.alert(language === "es" ? "Error" : "Error", error.response.data.athlete);
      } else if (error.response?.data?.detail) {
        Alert.alert(language === "es" ? "Error" : "Error", error.response.data.detail);
      } else {
        Alert.alert(language === "es" ? "Error" : "Error", language === "es" ? "No se pudo generar la invitación" : "Could not generate the invitation");
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <Text style={{ color: palette.text }}>
          {language === "es" ? "No se pudo cargar el perfil." : "Could not load profile."}
        </Text>
      </View>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (language === "es") {
      if (hour < 12) return "Buenos días";
      if (hour < 18) return "Buenas tardes";
      return "Buenas noches";
    } else {
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    }
  })();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: palette.surface, borderBottomColor: palette.borderSoft }]}>
          <Text style={[styles.greeting, { color: palette.subtext }]}>{greeting},</Text>
          <Text style={[styles.heroName, { color: palette.text }]}>{profile.first_name || profile.email}</Text>
          <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
            {language === "es" ? "¿Listo para tus metas? ¡Haz que hoy cuente!" : "Ready for your goals? Make today count!"}
          </Text>
        </View>

        {/* Coach Panel */}
        {profile.role.toUpperCase() === "COACH" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {language === "es" ? "Mis Atletas" : "My Athletes"}
            </Text>

            {profile.athletes?.map((a) => (
              <View key={a.id} style={[styles.block, { backgroundColor: palette.surface, borderColor: palette.border, shadowOpacity: isDarkMode ? 0.2 : 0.06 }]}>
                <Ionicons name="person-circle-outline" size={22} color={palette.accent} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.blockText, { color: palette.text }]}>{a.athlete_name}</Text>
                  <Text style={[styles.blockInfo, { color: palette.subtext }]}>{a.athlete_email}</Text>
                </View>
              </View>
            ))}

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  color: palette.inputText,
                  borderColor: palette.inputBorder,
                },
              ]}
              placeholder={language === "es" ? "Correo del atleta (opcional)" : "Athlete email (optional)"}
              placeholderTextColor={palette.placeholder}
              value={athleteEmail}
              onChangeText={setAthleteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity style={[styles.generateButton, { backgroundColor: palette.success }]} onPress={handleGenerateCode}>
              <Text style={styles.generateButtonText}>
                {language === "es" ? "Generar Código" : "Generate Code"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Athlete Panel */}
        {profile.role.toUpperCase() === "ATHLETE" && (
          <View style={styles.section}>
            {/* Header MI PROGRESO */}
            <View style={[styles.sectionHeader, styles.headerGapLarge]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="stats-chart-outline" size={18} color={palette.accent} />
                <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0, color: palette.text }]}>
                  {language === "es" ? "Mi Progreso" : "My Progress"}
                </Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: palette.surface, shadowOpacity: isDarkMode ? 0.2 : 0.06 }]}>
                <Ionicons name="flame" size={28} color={palette.accent} />
                <View style={{ marginLeft: 16 }}>
                  <Text style={[styles.cardValue, { color: palette.text }]}>12</Text>
                  <Text style={[styles.cardLabel, { color: palette.subtext }]}>{language === "es" ? "Días streak" : "Streak days"}</Text>
                </View>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, shadowOpacity: isDarkMode ? 0.2 : 0.06 }]}>
                <Ionicons name="barbell" size={28} color={palette.accent} />
                <View style={{ marginLeft: 16 }}>
                  <Text style={[styles.cardValue, { color: palette.text }]}>4</Text>
                  <Text style={[styles.cardLabel, { color: palette.subtext }]}>{language === "es" ? "Workouts esta semana" : "Workouts this week"}</Text>
                </View>
              </View>

              <View style={[styles.statCard, { backgroundColor: palette.surface, shadowOpacity: isDarkMode ? 0.2 : 0.06 }]}>
                <Ionicons name="calendar" size={28} color={palette.accent} />
                <View style={{ marginLeft: 16 }}>
                  <Text style={[styles.cardValue, { color: palette.text }]}>Upper Body</Text>
                  <Text style={[styles.cardLabel, { color: palette.subtext }]}>{language === "es" ? "Próximo workout" : "Next workout"}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ----- Títulos fuera + espacio ----- */}
        <View style={styles.section}>
          {/* Header "Desafío del día" */}
          <View style={[styles.sectionHeader, styles.headerGapLarge]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="flag-outline" size={18} color={palette.accent} />
              <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0, color: palette.text }]}>
                {language === "es" ? "Desafío del día" : "Today's challenge"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={shuffleChallenge} style={[styles.altBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Text style={[styles.altBtnText, { color: palette.accent }]}>
                  {language === "es" ? "Otro" : "Another"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleChallengeDone}
                style={[
                  styles.doneBtn,
                  { backgroundColor: palette.surfaceAlt, borderColor: isDarkMode ? "#444" : palette.border },
                  challengeDone && { backgroundColor: palette.success, borderColor: palette.success },
                ]}
              >
                <Ionicons
                  name={challengeDone ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={challengeDone ? (isDarkMode ? "#121212" : "#052e16") : palette.subtext}
                />
                <Text
                  style={[
                    styles.doneBtnText,
                    { color: palette.subtext },
                    challengeDone && { color: isDarkMode ? "#121212" : "#052e16", fontWeight: "800" },
                  ]}
                >
                  {language === "es" ? (challengeDone ? "Hecho" : "Marcar") : challengeDone ? "Done" : "Mark"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tarjeta del desafío */}
          <View style={[styles.challengeCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text
              style={[
                styles.challengeText,
                { color: palette.text },
                challengeDone && { color: palette.subtext, textDecorationLine: "line-through" },
              ]}
            >
              {challenge}
            </Text>
          </View>

          {/* Header "Hidratación" */}
          <View style={[styles.sectionHeader, styles.headerGap]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="water-outline" size={18} color={palette.accent} />
              <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0, color: palette.text }]}>
                {language === "es" ? "Hidratación" : "Hydration"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ color: palette.subtext, fontSize: 12 }}>
                {hydrationCount}/8 • {hydrationPct}%
              </Text>
              <TouchableOpacity
                onPress={confirmResetCups}
                style={[styles.resetBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
              >
                <Text style={[styles.resetBtnText, { color: palette.accent }]}>
                  {language === "es" ? "Reset" : "Reset"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tarjeta de hidratación */}
          <View style={[styles.hydrationCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={[styles.progressTrack, { backgroundColor: palette.trackBg, borderColor: palette.border }]}>
              <View style={[styles.progressFill, { width: `${hydrationPct}%`, backgroundColor: palette.accent }]} />
            </View>

            <View style={styles.cupsRow}>
              {cups.map((filled, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => toggleCup(idx)}
                  style={[
                    styles.cup,
                    { backgroundColor: palette.background, borderColor: palette.cupBorder },
                    filled && { backgroundColor: palette.accent, borderColor: palette.accent },
                  ]}
                >
                  <Ionicons
                    name="water-outline"
                    size={16}
                    color={filled ? (isDarkMode ? "#121212" : "#052e16") : palette.subtext}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        {/* ----- FIN ----- */}
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
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Hero
  hero: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
    borderBottomWidth: 0, // color dinámico
  },
  greeting: { fontSize: 18 },
  heroName: { fontSize: 32, fontWeight: "bold", marginTop: 5 },
  heroSubtitle: { fontSize: 16, marginTop: 8 },

  // Stats
  statsContainer: { marginTop: 15, flexDirection: "column", gap: 15 },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    elevation: 2,
    marginBottom: 10,
    width: width - 40,
    shadowColor: "#000",
    shadowRadius: 5,
  },
  cardValue: { fontSize: 20, fontWeight: "bold" },
  cardLabel: { fontSize: 14, marginTop: 4 },

  // Secciones / títulos
  section: { marginHorizontal: 20, marginVertical: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  // Pequeños ajustes de separación entre título y tarjeta
  headerGap: { marginBottom: 8 },
  headerGapLarge: { marginBottom: 12 },

  // Lista de atletas (COACH)
  block: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowRadius: 5,
    borderWidth: 1,
  },
  blockText: { fontSize: 16, fontWeight: "600" },
  blockInfo: { fontSize: 14 },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    marginTop: 10,
  },
  generateButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  generateButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  // Desafío
  challengeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 0,
    marginBottom: 12,
  },
  challengeText: { fontSize: 16, lineHeight: 22 },

  // Botones header (Otro / Marcar)
  altBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  altBtnText: { fontWeight: "700", fontSize: 12 },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  doneBtnText: { fontSize: 12, fontWeight: "700" },

  // Hidratación
  hydrationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 0,
  },
  cupsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  cup: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Barra de progreso
  progressTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 99,
    borderWidth: 1,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 99 },

  // Botón Reset
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetBtnText: { fontWeight: "700", fontSize: 12 },
});
