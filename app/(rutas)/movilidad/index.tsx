// app/(rutas)/movilidad/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "app/context/appContext";

type MobilityEx = { name: string; prescription: string };

// --- Data (sin videos/links) ---
const SQUAT: MobilityEx[] = [
  { name: "Dorsiflexión de tobillo", prescription: "2×10 (aguantar 3s abajo)" },
  { name: "Aductores en máquina", prescription: "2×15  RIR 3" },
  { name: "Rock back", prescription: "2×10" },
  { name: "Deep isometric squat", prescription: "2×1 min (aguantar abajo)" },
];

const BENCH: MobilityEx[] = [
  { name: "Rotación spiderman", prescription: "3×8" },
  { name: "Extensión torácica con foam roller", prescription: "3×10" },
  { name: "Rotación externa de hombro", prescription: "2×10" },
  { name: "Cat Camel", prescription: "2×15" },
  { name: "Foam roller scapular retraction", prescription: "2×10" },
];

const DEADLIFT: MobilityEx[] = [
  { name: "Banded Cat Camel stretch", prescription: "2×10" },
  { name: "Aductores en máquina", prescription: "2×15  RIR 3" },
  { name: "Extensión en banco romano", prescription: "2×15  RIR 3" },
  { name: "Rock back", prescription: "2×10" },
  { name: "90/90 Hip Flips", prescription: "2×10" },
  { name: "Sumo stance kettlebell swing", prescription: "2×15–20" },
];

export default function MovilidadScreen() {
  const router = useRouter();
  const { isDarkMode, language } = useAppContext();

  const t = (es: string, en: string) => (language === "es" ? es : en);

  const palette = isDarkMode
    ? {
        bg: "#0F0F0F",
        surface: "#1E1E1E",
        text: "#FFFFFF",
        sub: "#AAAAAA",
        border: "#2A2A2A",
        accent: "#EF233C",
        chip: "#222",
      }
    : {
        bg: "#F8FAFC",
        surface: "#FFFFFF",
        text: "#111111",
        sub: "#4B5563",
        border: "#E5E7EB",
        accent: "#EF233C",
        chip: "#F3F4F6",
      };

  const Section = ({
    title,
    data,
    expandedDefault = false,
  }: {
    title: string;
    data: MobilityEx[];
    expandedDefault?: boolean;
  }) => {
    const [open, setOpen] = useState(expandedDefault);
    return (
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => setOpen((v) => !v)}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{title}</Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={palette.sub} />
        </TouchableOpacity>

        {open && (
          <View style={{ marginTop: 8 }}>
            {data.map((ex, idx) => (
              <View
                key={`${ex.name}-${idx}`}
                style={[
                  styles.row,
                  {
                    borderColor: palette.border,
                    backgroundColor: isDarkMode ? "#181818" : "#FAFAFA",
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exName, { color: palette.text }]}>{ex.name}</Text>
                  <Text style={[styles.exPresc, { color: palette.sub }]}>{ex.prescription}</Text>
                </View>
                {/* 🔒 Sin botones ni enlaces a videos */}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          {t("Movilidad articular", "Joint Mobility")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Nota general */}
        <View
          style={[
            styles.info,
            { borderColor: palette.border, backgroundColor: isDarkMode ? "#151515" : "#FFF" },
          ]}
        >
          <Ionicons name="information-circle-outline" size={18} color={palette.accent} />
          <Text style={[styles.infoText, { color: palette.sub }]}>
            {t(
              "Realiza 30s de descanso entre series. Elige 4–6 ejercicios según tu necesidad antes de la sesión.",
              "Rest 30s between sets. Pick 4–6 drills as needed before your session."
            )}
          </Text>
        </View>

        <Section title="SQUAT" data={SQUAT} expandedDefault />
        <Section title="BENCH" data={BENCH} />
        <Section title="DEADLIFT" data={DEADLIFT} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },

  info: {
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  card: {
    marginTop: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 10,
  },
  exName: { fontSize: 14, fontWeight: "700" },
  exPresc: { fontSize: 12, marginTop: 2 },
});
