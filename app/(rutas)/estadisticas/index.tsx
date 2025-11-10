// app/tu-ruta/StrengthProgressScreen.tsx
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import {
  getAthleteProgressReport,
  getStrengthChart,
} from "services/trainingService";
import { getProfile } from "services/userService";
import BottomNav from "../../components/bottomNav";
import PullToRefresh from "../../components/PullToRefresh";
import { useAppContext } from "app/context/appContext";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const screenWidth = Dimensions.get("window").width;

interface Athlete {
  athlete: number;
  athlete_name: string;
  athlete_email: string;
}

interface Profile {
  id: number;
  role: "athlete" | "coach";
  athletes?: Athlete[];
}

type ChartShape = {
  labels: string[];
  datasets: { label?: string; data: number[] }[];
};

type BlockReport = {
  block: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
  };
  chart_data: ChartShape;
};

export default function StrengthProgressScreen() {
  const router = useRouter();
  const { isDarkMode, language } = useAppContext();

  // 🎨 Paleta por tema
  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        surface: "#1E1E1E",
        surfaceAlt: "#111111",
        text: "#FFFFFF",
        subtext: "#9CA3AF",
        border: "#2A2A2A",
        accent: "#EF233C",
        success: "#22c55e",
        neutral: "#9CA3AF",
      }
    : {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceAlt: "#FFFFFF",
        text: "#111827",
        subtext: "#6B7280",
        border: "#E5E7EB",
        accent: "#EF233C",
        success: "#16a34a",
        neutral: "#6B7280",
      };

  // 🗣️ Textos traducibles
  const T = {
    title: language === "es" ? "Progreso de Fuerza" : "Strength Progress",
    noAthletes:
      language === "es"
        ? "No hay atletas disponibles."
        : "No athletes available.",
    noData: language === "es" ? "No existen datos" : "No data available",
    noChart:
      language === "es" ? "No hay datos disponibles" : "No data available",
    viewProgress: language === "es" ? "Ver progreso" : "View progress",
    from: language === "es" ? "Desde" : "From",
    to: language === "es" ? "hasta" : "to",
    loading: language === "es" ? "Cargando datos..." : "Loading data...",
    error:
      language === "es" ? "Error al obtener datos." : "Error fetching data.",
  };

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAthlete, setLoadingAthlete] = useState<number | null>(null);
  const [athleteCharts, setAthleteCharts] = useState<
    Record<number, BlockReport[]>
  >({});
  const [selfChart, setSelfChart] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await getProfile();
      setProfile(profileRes);

      if (profileRes.role === "athlete") {
        const chartRes = await getStrengthChart();
        if (chartRes?.detail) setError(chartRes.detail);
        else setSelfChart(chartRes);
      }
    } catch (e) {
      console.error(e);
      setError(T.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewReport = async (athleteId: number) => {
    try {
      setLoadingAthlete(athleteId);
      const data = await getAthleteProgressReport(athleteId);
      const blocks: BlockReport[] = Array.isArray(data) ? data : [data];
      setAthleteCharts((prev) => ({ ...prev, [athleteId]: blocks }));
    } catch (err: any) {
      console.error("Error cargando gráfico del atleta:", err);
      Alert.alert("Error", T.error);
    } finally {
      setLoadingAthlete(null);
    }
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={{ color: palette.subtext, marginTop: 8 }}>
          {T.loading}
        </Text>
      </View>
    );

  if (error)
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[styles.errorText, { color: palette.accent }]}>
          {error}
        </Text>
      </View>
    );

  // === COACH ===
  if (profile?.role === "coach") {
    const athletes = profile.athletes || [];

    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: palette.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={26} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {T.title}
          </Text>
        </View>

        <PullToRefresh onRefresh={fetchData} style={{ flex: 1 }}>
          {athletes.length === 0 ? (
            <Text style={[styles.emptyText, { color: palette.subtext }]}>
              {T.noAthletes}
            </Text>
          ) : (
            athletes.map((a) => {
              const blocks = athleteCharts[a.athlete] || [];
              return (
                <View
                  key={a.athlete}
                  style={[
                    styles.athleteCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <View style={styles.athleteHeader}>
                    <Ionicons
                      name="person-circle-outline"
                      size={24}
                      color={palette.accent}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.athleteName, { color: palette.text }]}>
                      {a.athlete_name}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.viewButton,
                        { backgroundColor: palette.accent },
                      ]}
                      onPress={() => handleViewReport(a.athlete)}
                      disabled={loadingAthlete === a.athlete}
                    >
                      {loadingAthlete === a.athlete ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.viewButtonText}>
                          {T.viewProgress}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Bloques */}
                  {Array.isArray(blocks) && blocks.length > 0 ? (
                    blocks.map((block, idx) => (
                      <View
                        key={`${a.athlete}-${idx}`}
                        style={[
                          styles.blockCard,
                          { backgroundColor: palette.surfaceAlt },
                        ]}
                      >
                        {renderChart(block, palette, T)}
                      </View>
                    ))
                  ) : (
                    <Text
                      style={[styles.noHistoryText, { color: palette.subtext }]}
                    >
                      {T.noData}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </PullToRefresh>

        <BottomNav />
      </SafeAreaView>
    );
  }

  // === ATHLETE ===
  if (!selfChart || !selfChart.block) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: palette.background }]}
      >
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: palette.subtext }]}>
            {T.noChart}
          </Text>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          {T.title}
        </Text>
      </View>

      <PullToRefresh onRefresh={fetchData} style={styles.container}>
        <View
          style={[
            styles.blockCard,
            { backgroundColor: palette.surfaceAlt, marginTop: 8 },
          ]}
        >
          {renderChart(selfChart, palette, T)}
        </View>
      </PullToRefresh>
      <BottomNav />
    </SafeAreaView>
  );
}

/** === renderChart === */
function renderChart(input: any, palette: any, T: any) {
  const chart: ChartShape | null = input?.chart_data ? input.chart_data : input;

  if (
    !chart ||
    !Array.isArray(chart.labels) ||
    chart.labels.length === 0 ||
    !Array.isArray(chart.datasets) ||
    chart.datasets.length === 0
  ) {
    return (
      <View style={styles.center}>
        <Text style={[styles.noHistoryText, { color: palette.subtext }]}>
          {T.noData}
        </Text>
      </View>
    );
  }

  const colors = ["#EF233C", "#2563eb", "#22c55e", "#8e44ad", "#16a085"];
  const safeDatasets = chart.datasets.map((d) => ({
    data: (d?.data ?? []).map((v) => Number(v || 0)),
    label: d?.label ?? "",
  }));

  return (
    <View
      style={{
        marginBottom: 20,
        borderRadius: 16,
        backgroundColor: palette.surfaceAlt,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <Text
        style={{
          color: palette.text,
          fontWeight: "bold",
          textAlign: "center",
          fontSize: 16,
          marginBottom: 2,
        }}
      >
        {input.block?.name}
      </Text>
      <Text
        style={{
          color: palette.subtext,
          textAlign: "center",
          fontSize: 12,
          marginBottom: 8,
        }}
      >
        {input.block?.start_date} — {input.block?.end_date}
      </Text>

      <LineChart
        data={{
          labels: chart.labels,
          datasets: safeDatasets.map((d, i) => ({
            data: d.data,
            color: () => colors[i % colors.length],
            strokeWidth: 2,
          })),
          legend: safeDatasets.map((d) => d.label),
        }}
        width={screenWidth - 40}
        height={260}
        yAxisSuffix="kg"
        chartConfig={{
          backgroundGradientFrom: palette.surfaceAlt,
          backgroundGradientTo: palette.surfaceAlt,
          decimalPlaces: 1,
          color: () => palette.text,
          labelColor: () => palette.text,
          propsForDots: { r: "4" },
          propsForBackgroundLines: { stroke: palette.border },
        }}
        style={{ borderRadius: 12, alignSelf: "center" }}
        bezier
      />

      {/* Leyenda */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        {safeDatasets.map((d, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 8,
              marginVertical: 4,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: colors[i % colors.length],
                marginRight: 6,
              }}
            />
            <Text style={{ color: palette.text, fontSize: 12 }}>
              {d.label || `Serie ${i + 1}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  athleteCard: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  athleteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  athleteName: { fontSize: 18, fontWeight: "bold", flex: 1 },
  viewButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewButtonText: { color: "#fff", fontWeight: "600" },
  blockCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  blockTitle: {
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
  },
  chart: { borderRadius: 12, alignSelf: "center" },
  errorText: { textAlign: "center", fontSize: 16 },
  noHistoryText: { textAlign: "center", fontSize: 14 },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 16 },
});
