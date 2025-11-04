// app/tu-ruta/StrengthProgressScreen.tsx
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  getAthleteProgressReport,
  getStrengthChart,
} from "services/trainingService";
import { getProfile } from "services/userService";
import BottomNav from "../../components/bottomNav";

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAthlete, setLoadingAthlete] = useState<number | null>(null);
  const [athleteCharts, setAthleteCharts] = useState<
    Record<number, BlockReport[]>
  >({});
  const [selfChart, setSelfChart] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const profileRes = await getProfile();
        setProfile(profileRes);

        if (profileRes.role === "athlete") {
          const chartRes = await getStrengthChart();
          // para atleta sigue igual (un solo bloque actual)
          if (chartRes?.detail) setError(chartRes.detail);
          else setSelfChart(chartRes);
        }
      } catch (e) {
        console.error(e);
        setError("Error al obtener perfil o datos");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleViewReport = async (athleteId: number) => {
    try {
      setLoadingAthlete(athleteId);
      const data = await getAthleteProgressReport(athleteId);
      // Aseguramos array (el endpoint nuevo retorna array de bloques)
      const blocks: BlockReport[] = Array.isArray(data) ? data : [data];
      setAthleteCharts((prev) => ({ ...prev, [athleteId]: blocks }));
    } catch (err: any) {
      console.error("Error cargando gráfico del atleta:", err);
      Alert.alert("Error", "No se pudo obtener el reporte del atleta");
    } finally {
      setLoadingAthlete(null);
    }
  };

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color="#3b82f6"
        style={{ marginTop: 50 }}
      />
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  // === COACH ===
  if (profile?.role === "coach") {
    const athletes = profile.athletes || [];

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Progreso de Fuerza por Atleta</Text>

        {athletes.length === 0 ? (
          <Text style={styles.noDataText}>No hay atletas disponibles</Text>
        ) : (
          athletes.map((a) => {
            const blocks = athleteCharts[a.athlete] || [];
            return (
              <View key={a.athlete} style={styles.athleteContainer}>
                <View style={styles.athleteHeader}>
                  <Text style={styles.athleteName}>{a.athlete_name}</Text>
                  <Button
                    title="Ver progreso"
                    onPress={() => handleViewReport(a.athlete)}
                    color="#2563eb"
                    disabled={loadingAthlete === a.athlete}
                  />
                </View>

                {loadingAthlete === a.athlete && (
                  <ActivityIndicator
                    size="small"
                    color="#3b82f6"
                    style={{ marginVertical: 8 }}
                  />
                )}

                {/* Bloques */}
                {Array.isArray(blocks) && blocks.length > 0 ? (
                  blocks.map((block, idx) => (
                    <View
                      key={`${a.athlete}-${idx}`}
                      style={styles.blockContainer}
                    >
                      <Text style={styles.blockTitle}>
                        {block.block?.name || "Bloque sin nombre"}
                      </Text>
                      {renderChart(block.chart_data)}
                    </View>
                  ))
                ) : (
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={styles.errorText}>No existen datos</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    );
  }

  // === ATHLETE === (se mantiene como estaba)
  if (!selfChart)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No hay datos disponibles</Text>
      </View>
    );

  const chartData = selfChart.chart_data;
  const blockName = selfChart.block;
  const colors = ["#e74c3c", "#3498db", "#2ecc71"];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Progreso de Fuerza - {blockName}</Text>
      <Text style={styles.subtitle}>
        Desde {selfChart.start_date} hasta {selfChart.end_date}
      </Text>

      <LineChart
        data={{
          labels: chartData.labels,
          datasets: chartData.datasets.map((d: any, i: number) => ({
            data: d.data,
            color: () => colors[i],
            strokeWidth: 2,
          })),
        }}
        width={screenWidth - 32}
        height={260}
        yAxisSuffix="kg"
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          propsForDots: { r: "4" },
          propsForBackgroundLines: { stroke: "#e0e0e0" },
        }}
        style={styles.chart}
        bezier={false}
      />

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors[0] }]} />
          <Text>Sentadilla</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors[1] }]} />
          <Text>Press Banca</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors[2] }]} />
          <Text>Peso Muerto</Text>
        </View>
      </View>
    </ScrollView>
  );
}

/** RENDER CHART ROBUSTO:
 * acepta tanto {labels, datasets} como {chart_data: {labels, datasets}}
 */
function renderChart(input: any) {
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
        <Text style={styles.errorText}>No existen datos</Text>
      </View>
    );
  }

  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#8e44ad", "#16a085"];

  // Asegurar que datasets tengan arrays numéricos (evitar undefined/NaN)
  const safeDatasets = chart.datasets.map((d) => ({
    data: (d?.data ?? []).map((v) => Number(v || 0)),
    label: d?.label ?? "",
  }));

  return (
    <View style={{ marginBottom: 20 }}>
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
        width={screenWidth - 32}
        height={260}
        yAxisSuffix="kg"
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          propsForDots: { r: "4" },
          propsForBackgroundLines: { stroke: "#e0e0e0" },
        }}
        style={styles.chart}
        bezier
      />

      {/* Leyenda */}
      <View style={styles.legendContainer}>
        {safeDatasets.map((d, i) => (
          <View key={i} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors[i % colors.length] },
              ]}
            />
            <Text>{d.label || `Serie ${i + 1}`}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 16,
  },
  chart: { borderRadius: 12, marginVertical: 8, alignSelf: "center" },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  athleteContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    elevation: 1,
  },
  athleteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  athleteName: { fontSize: 16, fontWeight: "500" },
  errorText: { textAlign: "center", color: "#ef4444", fontSize: 16 },
  noDataText: { textAlign: "center", marginTop: 20, fontSize: 16 },
  blockContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    marginTop: 6,
  },
  blockTitle: {
    textAlign: "center",
    fontWeight: "600",
    marginVertical: 6,
  },
});
