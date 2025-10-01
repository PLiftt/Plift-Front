import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { getUserProfile } from "../../../services/userService";
import BottomNav from "../../components/bottomNav";
import { TrendingUp, TrendingDown, Activity } from "lucide-react-native";

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

  const colors = {
    background: "#000",
    cardBackground: "#111",
    primary: "#EF233C",
    secondary: "#4CAF50",
    textPrimary: "#fff",
    muted: "#888",
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  // Cálculos iniciales de stats (temporal, reemplazar con backend)
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
    const bw = bodyWeight;
    return (total * 500) / (a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4 + f * bw ** 5);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.header, { color: "#fff", textAlign: "center" }]}>
          Estadísticas de Rendimiento
        </Text>

        {/* ---------------- BLOQUE TOTAL ---------------- */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.primary, borderWidth: 2 }]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.smallText, { color: colors.muted, textTransform: "uppercase" }]}>
                Total (Squat + Bench + Deadlift)
              </Text>
              <Text style={[styles.bigText, { color: colors.primary }]}>{total} kg</Text>
            </View>
            <View style={styles.changeBadge}>
              {totalChange >= 0 ? <TrendingUp size={18} color={colors.secondary} /> : <TrendingDown size={18} color={colors.primary} />}
              <Text style={{ color: totalChange >= 0 ? colors.secondary : colors.primary }}>
                {totalChange >= 0 ? "+" : ""}{totalChange}
              </Text>
            </View>
          </View>
        </View>

        {/* ---------------- BLOQUES INDIVIDUALES ---------------- */}
        {/* Reemplazar cada StatCard con datos reales del backend */}
        <StatCard title="Body Weight" stat={stats.bodyWeight} colors={colors} icon={<Activity />} />
        <StatCard title="1RM Squat" stat={stats.squat} colors={colors} />
        <StatCard title="1RM Bench" stat={stats.bench} colors={colors} />
        <StatCard title="1RM Deadlift" stat={stats.deadlift} colors={colors} />

        {/* ---------------- BLOQUES DE RATIOS ---------------- */}
        {/* Reemplazar con cálculos reales o del backend */}
        <RatioCard title="Squat to Deadlift Ratio" value={(stats.squat.current / stats.deadlift.current) * 100} colors={colors} colorBar={colors.primary} />
        <RatioCard title="Bench to Squat Ratio" value={(stats.bench.current / stats.squat.current) * 100} colors={colors} colorBar={colors.secondary} />
        <RatioCard title="Wilks Score" value={calculateWilks(total, stats.bodyWeight.current)} colors={colors} isWilks />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

// ---------------- COMPONENTES ----------------
function StatCard({ title, stat, colors, icon }: any) {
  const isPositive = stat.change >= 0;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.rowBetween}>
        <Text style={[styles.smallText, { color: colors.muted, textTransform: "uppercase" }]}>{title}</Text>
        {icon && icon}
      </View>
      <Text style={[styles.bigText, { color: colors.primary }]}>{stat.current} {stat.unit}</Text>
      <View style={styles.rowBetween}>
        {isPositive ? <TrendingUp size={16} color={colors.secondary} /> : <TrendingDown size={16} color={colors.primary} />}
        <Text style={{ color: isPositive ? colors.secondary : colors.primary }}>
          {isPositive ? "+" : ""}{stat.change} {stat.unit}
        </Text>
      </View>
    </View>
  );
}

function RatioCard({ title, value, colors, colorBar, isWilks = false }: any) {
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.smallText, { color: colors.muted, textTransform: "uppercase" }]}>{title}</Text>
      <Text style={[styles.bigText, { color: colors.primary }]}>{isWilks ? value.toFixed(1) : value.toFixed(1) + "%"}</Text>
      {!isWilks && (
        <View style={styles.progressBackground}>
          <View style={[styles.progressBar, { width: `${Math.min(value, 100)}%`, backgroundColor: colorBar }]} />
        </View>
      )}
      {isWilks && <Text style={{ color: colors.muted, fontSize: 12 }}>Strength relative to body weight</Text>}
    </View>
  );
}

// ---------------- ESTILOS ----------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  card: { padding: 16, borderRadius: 12, marginVertical: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  changeBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  smallText: { fontSize: 12, fontWeight: "600" },
  bigText: { fontSize: 20, fontWeight: "bold" },
  progressBackground: { height: 6, width: "100%", backgroundColor: "#333", borderRadius: 3, marginTop: 4 },
  progressBar: { height: 6, borderRadius: 3 },
});
