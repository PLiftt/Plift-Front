import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  // ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard"; // ⬅️ NUEVO
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getUserProfile } from "../../../services/userService";
import { deleteToken, getToken } from "../../../services/secureStore";
import { createInvitation } from "../../../services/invitationService";
import BottomNav from "../../components/bottomNav";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "app/context/appContext";
import { BarChart } from "react-native-chart-kit"; // ⬅️ gráfico de barras

// ⬇️ Burbuja de chat IA
import AIChatWidget from "../../components/AIChatWidget";
import PullToRefresh from "../../components/PullToRefresh";
import { API_URL } from "@env";
import { scheduleLocalNotification } from "services/notificationService";
import { useToast } from "app/components/TopToast";

const { width } = Dimensions.get("window");
// 👇 padding interno del card y ancho real del chart (evita que "coma" el borde derecho)
const CHART_CARD_SIDE_PADDING = 16;
const chartWidth = width - 40 - CHART_CARD_SIDE_PADDING * 2; // 40 = márgenes laterales de la sección (20+20)

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
  // campos usados también en Estadísticas:
  bodyweight_kg?: number;
  squat_1rm?: number;
  bench_1rm?: number;
  deadlift_1rm?: number;
}

const HomeScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [athleteEmail, setAthleteEmail] = useState<string>("");

  const router = useRouter();
  const { isDarkMode, language } = useAppContext();
  const shownWelcomeRef = useRef(false);
  const toast = useToast();

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
      };

  // ----- HIDRATACIÓN -----
  const todayKey = new Date().toISOString().slice(0, 10);
  const WATER_KEY = `water:${todayKey}`;
  const [waterMl, setWaterMl] = useState<number>(0);

  const loadTodayWater = async () => {
    try {
      const raw = await AsyncStorage.getItem(WATER_KEY);
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n) && n >= 0) {
          setWaterMl(n);
          return;
        }
      }
      setWaterMl(0);
    } catch (e) {
      console.warn("No se pudo cargar agua total:", e);
    }
  };

  useEffect(() => {
    loadTodayWater();
  }, [WATER_KEY]);

  // Chequear nuevos bloques al entrar a Home (solo ATHLETE)
  const checkNewBlocks = useCallback(async () => {
    try {
      if (!profile || String(profile.role).toUpperCase() !== "ATHLETE") return;
      const token = await getToken("accessToken");
      if (!token) return;
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/blocks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: Array<{ id?: number }> = await res.json();
      const ids = (data || []).map((b) => Number(b.id || 0)).filter((n) => Number.isFinite(n));
      const newCount = ids.length;
      const newMaxId = ids.length ? Math.max(...ids) : 0;

      const COUNT_KEY = "blocks_seen_count";
      const MAXID_KEY = "blocks_seen_max_id";
      const [storedCountRaw, storedMaxRaw] = await Promise.all([
        AsyncStorage.getItem(COUNT_KEY),
        AsyncStorage.getItem(MAXID_KEY),
      ]);
      const storedCount = storedCountRaw ? Number(storedCountRaw) : null;
      const storedMaxId = storedMaxRaw ? Number(storedMaxRaw) : null;

      if (storedCount === null || storedMaxId === null) {
        await AsyncStorage.multiSet([
          [COUNT_KEY, String(newCount)],
          [MAXID_KEY, String(newMaxId)],
        ]);
        return;
      }

      const hasNew = newCount > storedCount || newMaxId > storedMaxId;
      if (hasNew) {
        const title = language === "es" ? "Nuevo bloque asignado" : "New block assigned";
        const body = language === "es" ? "Tu coach ha creado un nuevo bloque." : "Your coach created a new block.";
        toast.show(title, { type: "success" });
        await scheduleLocalNotification(title, body, { event: "NEW_BLOCK" });
        await AsyncStorage.multiSet([
          [COUNT_KEY, String(newCount)],
          [MAXID_KEY, String(newMaxId)],
        ]);
      }
    } catch {}
  }, [profile, language]);

  // Chequear nuevas sesiones al entrar a Home (solo ATHLETE)
  const checkNewSessions = useCallback(async () => {
    try {
      if (!profile || String(profile.role).toUpperCase() !== "ATHLETE") return;
      const token = await getToken("accessToken");
      if (!token) return;
      // Obtener bloques primero
      const resBlocks = await fetch(`${API_URL.replace(/\/$/, "")}/blocks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resBlocks.ok) return;
      const blocks: Array<{ id?: number }> = await resBlocks.json();
      const blockIds = (blocks || [])
        .map((b) => Number(b.id || 0))
        .filter((n) => Number.isFinite(n));
      if (!blockIds.length) return;

      // Consultar sesiones de todos los bloques en paralelo
      const sessArrays = await Promise.all(
        blockIds.map(async (bid) => {
          try {
            const r = await fetch(
              `${API_URL.replace(/\/$/, "")}/sessions/?block=${bid}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!r.ok) return [] as Array<{ id?: number }>;
            return (await r.json()) as Array<{ id?: number }>;
          } catch {
            return [] as Array<{ id?: number }>;
          }
        })
      );
      const allSessions = sessArrays.flat();
      const sessIds = allSessions
        .map((s) => Number(s.id || 0))
        .filter((n) => Number.isFinite(n));
      const newCount = sessIds.length;
      const newMaxId = sessIds.length ? Math.max(...sessIds) : 0;

      const COUNT_KEY = "sessions_seen_count";
      const MAXID_KEY = "sessions_seen_max_id";
      const [storedCountRaw, storedMaxRaw] = await Promise.all([
        AsyncStorage.getItem(COUNT_KEY),
        AsyncStorage.getItem(MAXID_KEY),
      ]);
      const storedCount = storedCountRaw ? Number(storedCountRaw) : null;
      const storedMaxId = storedMaxRaw ? Number(storedMaxRaw) : null;

      if (storedCount === null || storedMaxId === null) {
        await AsyncStorage.multiSet([
          [COUNT_KEY, String(newCount)],
          [MAXID_KEY, String(newMaxId)],
        ]);
        return;
      }

      const hasNew = newCount > storedCount || newMaxId > storedMaxId;
      if (hasNew) {
        const title = language === "es" ? "Nueva sesión disponible" : "New session available";
        const body = language === "es" ? "Tu coach ha agregado una nueva sesión." : "Your coach added a new session.";
        toast.show(title, { type: "info" });
        await scheduleLocalNotification(title, body, { event: "NEW_SESSION" });
        await AsyncStorage.multiSet([
          [COUNT_KEY, String(newCount)],
          [MAXID_KEY, String(newMaxId)],
        ]);
      }
    } catch {}
  }, [profile, language]);

  // Al entrar a Home por PRIMERA vez (persistente), muestra una alerta de bienvenida
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        try {
          const FLAG_KEY = "welcome_alert_shown";
          const already = await AsyncStorage.getItem(FLAG_KEY);
          if (!already && !shownWelcomeRef.current && !cancelled) {
            Alert.alert(
              language === "es" ? "Notificaciones activadas" : "Notifications enabled",
              language === "es"
                ? "Verás alertas cuando tu coach cree bloques o sesiones."
                : "You’ll see alerts when your coach creates blocks or sessions.",
              [{ text: "OK" }]
            );
            shownWelcomeRef.current = true;
            await AsyncStorage.setItem(FLAG_KEY, "true");
          }
        } catch {}
        if (!cancelled) {
          await checkNewBlocks();
          await checkNewSessions();
        }
      };
      run();
      return () => {
        cancelled = true;
      };
    }, [language, checkNewBlocks])
  );

  const fmtWater = (ml: number) =>
    ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${ml} ml`;

  const addWater = async (delta = 200) => {
    const next = Math.max(0, waterMl + delta);
    setWaterMl(next);
    try {
      await AsyncStorage.setItem(WATER_KEY, String(next));
    } catch {}
  };

  const confirmResetWater = () => {
    Alert.alert(
      language === "es" ? "Reiniciar hidratación" : "Reset hydration",
      language === "es"
        ? "¿Quieres reiniciar el agua total de hoy a 0 ml?"
        : "Do you want to reset today's total water to 0 ml?",
      [
        { text: language === "es" ? "Cancelar" : "Cancel", style: "cancel" },
        {
          text: language === "es" ? "Sí, reiniciar" : "Yes, reset",
          style: "destructive",
          onPress: async () => {
            setWaterMl(0);
            try {
              await AsyncStorage.setItem(WATER_KEY, "0");
            } catch {}
          },
        },
      ]
    );
  };

  // ----- PERFIL / OTRAS SECCIONES -----
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

      const title = language === "es" ? "Código generado" : "Code generated";
      const labelCopy = language === "es" ? "Copiar código" : "Copy code";
      const labelOk = language === "es" ? "OK" : "OK";
      const msg =
        (language === "es" ? "El código es: " : "Your code: ") +
        String(result.code);

      Alert.alert(
        title,
        msg,
        [
          {
            text: labelCopy,
            onPress: async () => {
              try {
                await Clipboard.setStringAsync(String(result.code));
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              } catch {}
            },
          },
          { text: labelOk, style: "default" },
        ],
        { cancelable: true }
      );

      setAthleteEmail("");
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.athlete) {
        Alert.alert(
          language === "es" ? "Error" : "Error",
          error.response.data.athlete
        );
      } else if (error.response?.data?.detail) {
        Alert.alert(
          language === "es" ? "Error" : "Error",
          error.response.data.detail
        );
      } else {
        Alert.alert(
          language === "es" ? "Error" : "Error",
          language === "es"
            ? "No se pudo generar la invitación"
            : "Could not generate the invitation"
        );
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
          {language === "es"
            ? "No se pudo cargar el perfil."
            : "Could not load profile."}
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

  // Datos reales que ya tienes (igual que la Screen de estadísticas)
  const squat = Number(profile.squat_1rm ?? 0);
  const bench = Number(profile.bench_1rm ?? 0);
  const deadlift = Number(profile.deadlift_1rm ?? 0);

  // Dataset del gráfico de barras (SQ/BP/DL)
  const progressData = {
    labels: ["SQ", "BP", "DL"],
    datasets: [
      {
        data: [squat, bench, deadlift],
        strokeWidth: 2,
      },
    ],
    legend: [
      language === "es" ? "1RM por levantamiento (kg)" : "1RM per lift (kg)",
    ],
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <PullToRefresh
        contentContainerStyle={{ paddingBottom: 120 }}
        onRefresh={async () => {
          await fetchProfile();
          await loadTodayWater();
        }}
        accentColor={palette.accent}
        isDarkMode={isDarkMode}
      >
        {/* Hero */}
        <View
          style={[
            styles.hero,
            {
              backgroundColor: palette.surface,
              borderBottomColor: palette.borderSoft,
            },
          ]}
        >
          <Text style={[styles.greeting, { color: palette.subtext }]}>
            {greeting},
          </Text>
          <Text style={[styles.heroName, { color: palette.text }]}>
            {profile.first_name || profile.email}
          </Text>
          <Text style={[styles.heroSubtitle, { color: palette.subtext }]}>
            {language === "es"
              ? "¿Listo para tus metas? ¡Haz que hoy cuente!"
              : "Ready for your goals? Make today count!"}
          </Text>
        </View>

        {/* Coach Panel */}
        {profile.role.toUpperCase() === "COACH" && (
          <View className="coach-section" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {language === "es" ? "Mis Atletas" : "My Athletes"}
            </Text>

            {profile.athletes?.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.block,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    shadowOpacity: isDarkMode ? 0.2 : 0.06,
                  },
                ]}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={22}
                  color={palette.accent}
                />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.blockText, { color: palette.text }]}>
                    {a.athlete_name}
                  </Text>
                  <Text style={[styles.blockInfo, { color: palette.subtext }]}>
                    {a.athlete_email}
                  </Text>
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
              placeholder={
                language === "es"
                  ? "Correo del atleta (opcional)"
                  : "Athlete email (optional)"
              }
              placeholderTextColor={palette.placeholder}
              value={athleteEmail}
              onChangeText={setAthleteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                styles.generateButton,
                { backgroundColor: palette.success },
              ]}
              onPress={handleGenerateCode}
            >
              <Text style={styles.generateButtonText}>
                {language === "es" ? "Generar Código" : "Generate Code"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Athlete Panel */}
        {profile.role.toUpperCase() === "ATHLETE" && (
          <View style={styles.section}>
            {/* Mi Progreso */}
            <View style={[styles.sectionHeader, styles.headerGapLarge]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="stats-chart-outline"
                  size={18}
                  color={palette.accent}
                />
                <Text
                  style={[
                    styles.sectionTitle,
                    { marginLeft: 8, marginBottom: 0, color: palette.text },
                  ]}
                >
                  {language === "es" ? "Mi Progreso" : "My Progress"}
                </Text>
              </View>
            </View>

            {/* Gráfico de barras con datos reales (1RM actuales) */}
            <View
              style={[
                styles.progressCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <BarChart
                data={progressData}
                width={chartWidth} // 👈 ancho real del gráfico dentro del card
                height={220}
                fromZero
                yAxisSuffix="kg"
                yAxisLabel=""
                chartConfig={{
                  backgroundGradientFrom: palette.surface,
                  backgroundGradientTo: palette.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(239, 35, 60, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(${
                      isDarkMode ? "255,255,255" : "17,17,17"
                    }, ${opacity})`,
                  propsForBackgroundLines: { stroke: palette.border },
                  barPercentage: 0.6,
                }}
                // que el redondeo sea del card, no del chart
                style={{ borderRadius: 0, marginRight: 0 }}
              />
              <Text
                style={{
                  marginTop: 8,
                  textAlign: "center",
                  color: palette.subtext,
                  fontSize: 12,
                }}
              >
                {language === "es"
                  ? "1RM actuales por levantamiento"
                  : "Current 1RM by lift"}
              </Text>
            </View>
          </View>
        )}

        {/* === Calculadoras (Coach o Athlete) === */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, styles.headerGapLarge]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="calculator-outline"
                size={18}
                color={palette.accent}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { marginLeft: 8, marginBottom: 0, color: palette.text },
                ]}
              >
                {language === "es" ? "Calculadoras" : "Calculators"}
              </Text>
            </View>
          </View>

          {/* Botón: 1RM */}
          <TouchableOpacity
            onPress={() => router.push("/calculadora")}
            style={[
              styles.statCard,
              {
                backgroundColor: palette.surface,
                shadowOpacity: isDarkMode ? 0.2 : 0.06,
                borderWidth: 1,
                borderColor: palette.border,
              },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons
              name="calculator-outline"
              size={28}
              color={palette.accent}
            />
            <View style={{ marginLeft: 16 }}>
              <Text style={[styles.cardValue, { color: palette.text }]}>
                {language === "es" ? "Calcular 1RM" : "Calculate 1RM"}
              </Text>
              <Text style={[styles.cardLabel, { color: palette.subtext }]}>
                {language === "es" ? "Por RPE y repeticiones" : "By RPE & reps"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Botón: Discos */}
          <TouchableOpacity
            onPress={() => router.push("/discos")}
            style={[
              styles.statCard,
              {
                backgroundColor: palette.surface,
                shadowOpacity: isDarkMode ? 0.2 : 0.06,
                borderWidth: 1,
                borderColor: palette.border,
              },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons name="disc-outline" size={28} color={palette.accent} />
            <View style={{ marginLeft: 16 }}>
              <Text style={[styles.cardValue, { color: palette.text }]}>
                {language === "es" ? "Calcular discos" : "Plate calculator"}
              </Text>
              <Text style={[styles.cardLabel, { color: palette.subtext }]}>
                {language === "es" ? "Desglose por lado" : "Per-side breakdown"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Movilidad + Hidratación */}
        <View style={styles.section}>
          {/* Movilidad */}
          <View style={[styles.sectionHeader, styles.headerGapLarge]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="body-outline" size={18} color={palette.accent} />
              <Text
                style={[
                  styles.sectionTitle,
                  { marginLeft: 8, marginBottom: 0, color: palette.text },
                ]}
              >
                {language === "es" ? "Movilidad" : "Mobility"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.mobilityCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.challengeText, { color: palette.text }]}>
              {language === "es"
                ? "Drills sugeridos para preparar cadera, hombro y cadena posterior antes de entrenar."
                : "Suggested drills to prep hips, shoulders and posterior chain before training."}
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/movilidad")}
              style={[
                styles.generateButton,
                { backgroundColor: palette.accent, marginTop: 12 },
              ]}
              activeOpacity={0.9}
            >
              <Text style={styles.generateButtonText}>
                {language === "es" ? "Movilidad articular" : "Joint mobility"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hidratación */}
          <View style={[styles.sectionHeader, styles.headerGap]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="water-outline" size={18} color={palette.accent} />
              <Text
                style={[
                  styles.sectionTitle,
                  { marginBottom: 0, color: palette.text },
                ]}
              >
                {language === "es" ? "Hidratación" : "Hydration"} —{" "}
                {fmtWater(waterMl)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={confirmResetWater}
              style={[
                styles.resetBtn,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.resetBtnText, { color: palette.accent }]}>
                {language === "es" ? "Reset" : "Reset"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card con la gota (dentro del container) */}
          <View
            style={[
              styles.hydrationCard,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                addWater(+200);
              }}
              onLongPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                addWater(-200);
              }}
              delayLongPress={250}
              activeOpacity={0.85}
              style={styles.bigDrop}
            >
              <Ionicons name="water" size={40} color={palette.accent} />
              <Text style={[styles.bigDropText, { color: palette.accent }]}>
                +200 ml
              </Text>
              <Text
                style={{ fontSize: 11, color: palette.subtext, marginTop: 4 }}
              >
                {language === "es"
                  ? "Mantén presionado para -200 ml"
                  : "Long-press for −200 ml"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </PullToRefresh>

      {/* burbuja de chat IA */}
      {profile.role?.toUpperCase() === "ATHLETE" && (
        <AIChatWidget
          userName={profile.first_name || profile.email}
          role={profile.role}
        />
      )}

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
    borderBottomWidth: 0,
  },
  greeting: { fontSize: 18 },
  heroName: { fontSize: 32, fontWeight: "bold", marginTop: 5 },
  heroSubtitle: { fontSize: 16, marginTop: 8 },

  // Secciones / títulos
  section: { marginHorizontal: 20, marginVertical: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
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

  // Inputs
  input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14 },
  generateButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },
  generateButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  // Stats / cards
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

  // Tarjetas
  mobilityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 0,
    marginBottom: 12,
  },
  challengeText: { fontSize: 16, lineHeight: 22 },

  // Hidratación
  hydrationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetBtnText: { fontWeight: "700", fontSize: 12 },

  bigDrop: {
    alignItems: "center",
    justifyContent: "center",
  },
  bigDropText: { fontWeight: "800", fontSize: 16, marginTop: 6 },

  // Progreso (gráfico)
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: CHART_CARD_SIDE_PADDING,
    overflow: "hidden",
  },
});

