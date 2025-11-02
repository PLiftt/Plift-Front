import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator, Dimensions, StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { getStrengthChart } from "services/trainingService";

const screenWidth = Dimensions.get("window").width;

export default function StrengthProgressScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getStrengthChart();
        if (res.detail) setError(res.detail);
        else setData(res);
      } catch (e) {
        setError("Error al obtener los datos del gráfico");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading)
    return <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />;

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  if (!data?.chart_data)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No hay datos disponibles</Text>
      </View>
    );

  const chartData = data.chart_data;
  const blockName = data.block;

  // Colores fijos por movimiento
  const colors = ["#e74c3c", "#3498db", "#2ecc71"]; // rojo, azul, verde

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Progreso de Fuerza - {blockName}</Text>
      <Text style={styles.subtitle}>
        Desde {data.start_date} hasta {data.end_date}
      </Text>

      <LineChart
        data={{
          labels: chartData.labels,
          datasets: chartData.datasets.map((d: any, i: number) => ({
            data: d.data,
            color: (opacity = 1) => colors[i], // <--- color por línea
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
        bezier={false} // <--- sin bezier para mantener colores consistentes
      />

      {/* Leyenda personalizada */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
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
  chart: {
    borderRadius: 12,
    marginVertical: 8,
    alignSelf: "center",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  errorText: {
    textAlign: "center",
    color: "#ef4444",
    fontSize: 16,
  },
});

