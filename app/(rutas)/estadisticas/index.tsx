import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { getUserProfile } from "../../../services/userService";
import BottomNav from "../../components/bottomNav";
import { TrendingUp, TrendingDown, Activity } from "lucide-react-native";
import PullToRefresh from "../../components/PullToRefresh";
import { useAppContext } from "app/context/appContext";

const { width } = Dimensions.get("window");

interface UserProfile {
  first_name?: string;
  second_name?: string | null;
  last_name?: string;
  second_last_name?: string | null;
  bodyweight_kg?: number;
  squat_1rm?: number;
  bench_1rm?: number;
  deadlift_1rm?: number;
}

export default function EstadisticasPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, language } = useAppContext();
  // no local anim state; handled by PullToRefresh

  // 🎨 Paleta por tema (solo estilos)
  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        cardBackground: "#1E1E1E",
        cardAlt: "#1A1A1A",
        primary: "#EF233C",
        secondary: "#28a745",
        textPrimary: "#FFFFFF",
        muted: "#9CA3AF",
        border: "#262626",
        track: "#22262E",
      }
    : {
        background: "#F8FAFC",
        cardBackground: "#FFFFFF",
        cardAlt: "#FFFFFF",
        primary: "#EF233C",
        secondary: "#22c55e",
        textPrimary: "#111827",
        muted: "#6B7280",
        border: "#E5E7EB",
        track: "#E5E7EB",
      };

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile({
        first_name: data.first_name,
        second_name: data.second_name,
        last_name: data.last_name,
        second_last_name: data.second_last_name,
        bodyweight_kg: data.bodyweight_kg,
        squat_1rm: data.squat_1rm,
        bench_1rm: data.bench_1rm,
        deadlift_1rm: data.deadlift_1rm,
      });
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    await fetchProfile();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: palette.textPrimary }}>
          {language === "es" ? "No se pudo cargar el perfil." : "Could not load profile."}
        </Text>
      </View>
    );
  }

  // Cálculos iniciales de stats (temporal)
  const stats = {
    bodyWeight: { current: profile.bodyweight_kg ?? 0, previous: profile.bodyweight_kg ?? 0, unit: "kg", change: 0 },
    squat: { current: profile.squat_1rm ?? 0, previous: profile.squat_1rm ?? 0, unit: "kg", change: 0 },
    bench: { current: profile.bench_1rm ?? 0, previous: profile.bench_1rm ?? 0, unit: "kg", change: 0 },
    deadlift: { current: profile.deadlift_1rm ?? 0, previous: profile.deadlift_1rm ?? 0, unit: "kg", change: 0 },
  };

  const total = stats.squat.current + stats.bench.current + stats.deadlift.current;
  const previousTotal = stats.squat.previous + stats.bench.previous + stats.deadlift.previous;
  const totalChange = total - previousTotal;

  const calculateWilks = (total: number, bodyWeight: number) => {
    const a = -216.0475144,
      b = 16.2606339,
      c = -0.002388645,
      d = -0.00113732,
      e = 7.01863e-6,
      f = -1.291e-8;
    const bw = bodyWeight || 0.00001; // evitar división por 0
    return (total * 500) / (a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4 + f * bw ** 5);
  };

  // Textos
  const T = {
    header: language === "es" ? "Estadísticas de Rendimiento" : "Performance Statistics",
    totalLabel: language === "es" ? "Total (Sentadilla + Banca + Peso Muerto)" : "Total (Squat + Bench + Deadlift)",
    body: language === "es" ? "Peso corporal" : "Body Weight",
    squat: "1RM Squat",
    bench: "1RM Bench",
    deadlift: "1RM Deadlift",
    squatDead: language === "es" ? "Ratio Sentadilla / Peso Muerto" : "Squat to Deadlift Ratio",
    benchSquat: language === "es" ? "Ratio Banca / Sentadilla" : "Bench to Squat Ratio",
    wilks: "Wilks Score",
    wilksNote: language === "es" ? "Fuerza relativa al peso corporal" : "Strength relative to body weight",
  };

  const squatDeadRatio = stats.deadlift.current ? (stats.squat.current / stats.deadlift.current) * 100 : 0;
  const benchSquatRatio = stats.squat.current ? (stats.bench.current / stats.squat.current) * 100 : 0;
  const wilks = calculateWilks(total, stats.bodyWeight.current);

  const isTotalPositive = totalChange >= 0;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <PullToRefresh
        onRefresh={onRefresh}
        accentColor={palette.primary}
        bannerColor={palette.secondary}
        isDarkMode={isDarkMode}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        {/* Header */}
        <Text style={[styles.header, { color: palette.textPrimary, textAlign: "center" }]}>{T.header}</Text>

        {/* ---------------- BLOQUE TOTAL ---------------- */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.cardBackground,
              borderColor: palette.primary,
              borderWidth: 2,
              shadowColor: "#000",
              shadowOpacity: isDarkMode ? 0.2 : 0.06,
              shadowRadius: 5,
            },
          ]}
        >
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.smallText, { color: palette.muted, textTransform: "uppercase" }]}>
                {T.totalLabel}
              </Text>
              <Text style={[styles.bigText, { color: palette.primary }]}>{total} kg</Text>
            </View>
            <View style={styles.changeBadge}>
              {isTotalPositive ? (
                <TrendingUp size={18} color={palette.secondary} />
              ) : (
                <TrendingDown size={18} color={palette.primary} />
              )}
              <Text style={{ color: isTotalPositive ? palette.secondary : palette.primary }}>
                {isTotalPositive ? "+" : ""}
                {totalChange}
              </Text>
            </View>
          </View>
        </View>

        {/* ---------------- BLOQUES INDIVIDUALES ---------------- */}
        <StatCard title={T.body}   stat={stats.bodyWeight} colors={palette} icon={<Activity color={palette.primary} />} />
        <StatCard title={T.squat}  stat={stats.squat}      colors={palette} />
        <StatCard title={T.bench}  stat={stats.bench}      colors={palette} />
        <StatCard title={T.deadlift} stat={stats.deadlift} colors={palette} />

        {/* ---------------- BLOQUES DE RATIOS ---------------- */}
        <RatioCard title={T.squatDead} value={squatDeadRatio} colors={palette} colorBar={palette.primary} />
        <RatioCard title={T.benchSquat} value={benchSquatRatio} colors={palette} colorBar={palette.secondary} />
        <RatioCard title={T.wilks} value={wilks} colors={palette} isWilks note={T.wilksNote} />
      </PullToRefresh>

      <BottomNav />
    </View>
  );
}

/* ---------------- COMPONENTES ---------------- */
function StatCard({ title, stat, colors, icon }: any) {
  const isPositive = stat.change >= 0;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderWidth: 1,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        <Text style={[styles.smallText, { color: colors.muted, textTransform: "uppercase" }]}>
          {title}
        </Text>
        {icon || null}
      </View>
      <Text style={[styles.bigText, { color: colors.primary }]}>
        {stat.current} {stat.unit}
      </Text>
      <View style={styles.rowBetween}>
        {isPositive ? <TrendingUp size={16} color={colors.secondary} /> : <TrendingDown size={16} color={colors.primary} />}
        <Text style={{ color: isPositive ? colors.secondary : colors.primary }}>
          {isPositive ? "+" : ""}
          {stat.change} {stat.unit}
        </Text>
      </View>
    </View>
  );
}

function RatioCard({ title, value, colors, colorBar, isWilks = false, note }: any) {
  const clamped = Math.max(0, Math.min(value || 0, 999)); // por si hay NaN/∞
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderWidth: 1,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
      ]}
    >
      <Text style={[styles.smallText, { color: colors.muted, textTransform: "uppercase" }]}>{title}</Text>
      <Text style={[styles.bigText, { color: colors.primary }]}>
        {isWilks ? clamped.toFixed(1) : `${clamped.toFixed(1)}%`}
      </Text>
      {!isWilks && (
        <View style={[styles.progressBackground, { backgroundColor: colors.track }]}>
          <View style={[styles.progressBar, { width: `${Math.min(clamped, 100)}%`, backgroundColor: colorBar }]} />
        </View>
      )}
      {isWilks && (
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {note || "Strength relative to body weight"}
        </Text>
      )}
    </View>
  );
}

/* ---------------- ESTILOS ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },

  card: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  changeBadge: { flexDirection: "row", alignItems: "center", gap: 6 },

  smallText: { fontSize: 12, fontWeight: "600" },
  bigText: { fontSize: 20, fontWeight: "bold" },

  progressBackground: {
    height: 6,
    width: "100%",
    borderRadius: 3,
    marginTop: 6,
    overflow: "hidden",
  },
  progressBar: { height: 6, borderRadius: 3 },
});
