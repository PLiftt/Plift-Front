// app/(rutas)/discos/index.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  // ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppContext } from "app/context/appContext";
import PullToRefresh from "../../components/PullToRefresh";

/** =============================
 *  Configuración de placas
 *  =============================*/
type Plate = { value: number; color: string; label: string };

const KG_PLATES: Plate[] = [
  { value: 25, color: "#E10600", label: "25 kg" },      // rojo
  { value: 20, color: "#0151B0", label: "20 kg" },      // azul
  { value: 15, color: "#FFB703", label: "15 kg" },      // amarillo
  { value: 10, color: "#2E7D32", label: "10 kg" },      // verde
  { value: 5,  color: "#F5F5F5", label: "5 kg" },       // blanco
  { value: 2.5,color: "#111111", label: "2.5 kg" },     // negro
  // fraccionales plateados:
  { value: 1.25, color: "#B8B8B8", label: "1.25 kg" },
  { value: 1,    color: "#B8B8B8", label: "1 kg" },
  { value: 0.5,  color: "#B8B8B8", label: "0.5 kg" },
  { value: 0.25, color: "#B8B8B8", label: "0.25 kg" },
];

const LB_PLATES: Plate[] = [
  { value: 45, color: "#111111", label: "45 lb" },
  { value: 35, color: "#333333", label: "35 lb" },
  { value: 25, color: "#555555", label: "25 lb" },
  { value: 10, color: "#777777", label: "10 lb" },
  { value: 5,  color: "#999999", label: "5 lb"  },
  { value: 2.5,color: "#B8B8B8", label: "2.5 lb" },
  { value: 1.25,color:"#C8C8C8", label: "1.25 lb" },
];

/** Conversión y helpers numéricos */
const kg2lb = (kg: number) => kg * 2.2046226218;
const lb2kg = (lb: number) => lb / 2.2046226218;
type Unit = "kg" | "lb";
const toNum = (s: string) => parseFloat((s || "").replace(",", "."));
const fmt = (x: number, u: Unit) => (u === "kg" ? x.toFixed(1) : Math.round(x).toString()); // kg con 1 decimal, lb entero

// Selecciones de barra por unidad
const BAR_OPTIONS_KG = [20, 15, 10];
const BAR_OPTIONS_LB = [45, 35, 22];

/** Utils de color para contraste de texto en placa */
const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};
const relLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const toLin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = toLin(r), G = toLin(g), B = toLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const textOn = (bgHex: string) => (relLuminance(bgHex) > 0.5 ? "#111" : "#fff");

export default function DiscosScreen() {
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
        input: "#1A1A1A",
        barMetal: "#A7A7A7",
      }
    : {
        bg: "#F8FAFC",
        surface: "#FFFFFF",
        text: "#111111",
        sub: "#4B5563",
        border: "#E5E7EB",
        accent: "#EF233C",
        input: "#FFFFFF",
        barMetal: "#4B5563",
      };

  /** =============================
   *  Inputs
   *  =============================*/
  const [unit, setUnit] = useState<Unit>("kg");
  const [target, setTarget] = useState<string>("140");  // peso objetivo total (con barra)
  const [bar, setBar] = useState<number>(20);           // peso de la barra

  // al cambiar unidad, convierte target y ajusta barra por defecto
  const onUnitChange = (u: Unit) => {
    setUnit((prevUnit) => {
      const curr = toNum(target);
      if (isFinite(curr)) {
        const converted = u === "kg" ? lb2kg(curr) : kg2lb(curr);
        setTarget(fmt(converted, u));
      }
      setBar(u === "kg" ? 20 : 45);
      return u;
    });
  };

  /** =============================
   *  Cálculo (sin collares y sin redondeo)
   *  =============================*/
  const { perSide, usedTotal, diff, breakdown, visual } = useMemo(() => {
    const tRaw = toNum(target);
    if (!isFinite(tRaw)) {
      return { perSide: NaN, usedTotal: NaN, diff: NaN, breakdown: [] as { plate: Plate; count: number }[], visual: [] as Plate[] };
    }

    const plates = unit === "kg" ? KG_PLATES : LB_PLATES;
    const barW = bar;

    let perSideLoad = (tRaw - barW) / 2;
    if (!isFinite(perSideLoad) || perSideLoad < 0) {
      return { perSide: NaN, usedTotal: NaN, diff: NaN, breakdown: [], visual: [] };
    }

    // Greedy de mayor a menor
    const list: { plate: Plate; count: number }[] = [];
    let rem = perSideLoad;

    for (const p of plates) {
      const n = Math.floor(rem / p.value + 1e-9);
      if (n > 0) {
        list.push({ plate: p, count: n });
        rem -= n * p.value;
      }
    }

    const usedPerSide = perSideLoad - rem;
    const totalUsed = usedPerSide * 2 + barW;
    const delta = totalUsed - tRaw;

    // Visual: array plano de placas por lado (interior→exterior)
    const vis: Plate[] = list.flatMap(({ plate, count }) => Array.from({ length: count }, () => plate));

    return {
      perSide: usedPerSide,
      usedTotal: totalUsed,
      diff: delta,
      breakdown: list,
      visual: vis,
    };
  }, [unit, target, bar]);

  /** =============================
   *  Auto–scaling + Compactor “+N”
   *  =============================*/
  const BAR_WIDTH = 14;    // px
  const SIDE_PADDING = 12; // px
  const MIN_W = 14;        // ancho mínimo de disco (⬅️ más chico para pesos extremos)
  const MAX_W = 36;        // ancho máximo estético
  const MIN_GAP = 2;       // gap mínimo
  const BASE_GAP = 6;      // gap base

  const [stackWidth, setStackWidth] = useState(0);
  const onStackLayout = (e: LayoutChangeEvent) => setStackWidth(e.nativeEvent.layout.width);

  const sizing = useMemo(() => {
    // valores por defecto (antes del layout)
    if (!stackWidth) {
      return {
        plateW: 36, plateH: 72, gap: BASE_GAP, fontSize: 10, showText: true,
        compactCount: 0, compactVisual: visual,
      };
    }

    const count = Math.max(visual.length, 1);
    const usable = Math.max(0, stackWidth - BAR_WIDTH - SIDE_PADDING * 2);
    const perSideAvail = usable / 2;

    // 1) Intento con gap base
    let gap = BASE_GAP;
    let plateW = Math.floor((perSideAvail - (count - 1) * gap) / count);
    if (plateW > MAX_W) plateW = MAX_W;

    // 2) Si no entra, prueba bajar el gap
    if (plateW < MIN_W) {
      gap = MIN_GAP;
      plateW = Math.floor((perSideAvail - (count - 1) * gap) / count);
    }

    // 3) Si aun así supera el límite mínimo, compactor
    let compactCount = 0;
    let compactVisual = visual;
    if (plateW < MIN_W) {
      // máximo ítems que caben con MIN_W y MIN_GAP
      const maxCountFit = Math.max(
        1,
        Math.floor((perSideAvail + MIN_GAP) / (MIN_W + MIN_GAP))
      );

      if (count > maxCountFit) {
        // reservamos 1 slot para el badge "+N"
        const keep = Math.max(1, maxCountFit - 1);
        compactCount = count - keep;
        compactVisual = visual.slice(0, keep); // mantenemos los más cercanos a la barra
      }

      gap = MIN_GAP;
      plateW = Math.min(MAX_W, Math.max(MIN_W, Math.floor((perSideAvail - (Math.max(compactVisual.length,1) - 1) * gap) / Math.max(compactVisual.length,1))));
    }

    const plateH = Math.round(plateW * 2); // proporción 1:2
    const fontSize = plateW >= 30 ? 10 : plateW >= 24 ? 9 : plateW >= 18 ? 8 : 7;
    const showText = plateW >= 18;

    return { plateW, plateH, gap, fontSize, showText, compactCount, compactVisual };
  }, [stackWidth, visual]);

  /** UI helpers */
  const UnitSwitch = () => (
    <View style={[styles.segment, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <TouchableOpacity
        onPress={() => onUnitChange("kg")}
        style={[styles.segmentBtn, unit === "kg" && { backgroundColor: palette.accent }]}
      >
        <Text style={[styles.segmentText, { color: unit === "kg" ? "#fff" : palette.text }]}>kg</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onUnitChange("lb")}
        style={[styles.segmentBtn, unit === "lb" && { backgroundColor: palette.accent }]}
      >
        <Text style={[styles.segmentText, { color: unit === "lb" ? "#fff" : palette.text }]}>lb</Text>
      </TouchableOpacity>
    </View>
  );

  const BarSelector = () => {
    const options = unit === "kg" ? BAR_OPTIONS_KG : BAR_OPTIONS_LB;
    return (
      <View style={styles.row}>
        {options.map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setBar(v)}
            style={[
              styles.pill,
              { borderColor: palette.border, backgroundColor: palette.surface },
              bar === v && { backgroundColor: palette.accent, borderColor: palette.accent },
            ]}
          >
            <Text style={{ color: bar === v ? "#fff" : palette.text, fontWeight: "700" }}>
              {v} {unit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const DiffBadge = () => {
    if (!isFinite(diff)) return null;
    if (Math.abs(diff) < 1e-6) {
      return (
        <View style={[styles.badge, { backgroundColor: "#16a34a" }]}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>{t("Exacto", "Exact match")}</Text>
        </View>
      );
    }
    const sign = diff > 0 ? "+" : "−";
    const color = diff > 0 ? "#eab308" : "#ef4444";
    const abs = Math.abs(diff);
    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={{ color: "#111", fontWeight: "800" }}>
          {t("Diferencia", "Difference")}: {sign}
          {abs.toFixed(2)} {unit}
        </Text>
      </View>
    );
  };

  /** =============================
   *  Render
   *  =============================*/
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <PullToRefresh
        contentContainerStyle={{ paddingBottom: 24 }}
        onRefresh={async () => {
          setUnit("kg");
          setTarget("140");
          setBar(20);
        }}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {t("Calculadora de discos", "Plate Calculator")}
          </Text>
        </View>

        {/* Card: Inputs */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {/* Unidad */}
          <Text style={[styles.label, { color: palette.sub }]}>{t("Unidad", "Unit")}</Text>
          <UnitSwitch />

          {/* Peso objetivo */}
          <Text style={[styles.label, { color: palette.sub, marginTop: 12 }]}>
            {t("Peso objetivo (total con barra)", "Target weight (total incl. bar)")}
          </Text>
          <View style={styles.row}>
            <TextInput
              keyboardType="decimal-pad"
              value={target}
              onChangeText={setTarget}
              placeholder={unit === "kg" ? "140" : "315"}
              placeholderTextColor={palette.sub}
              style={[
                styles.input,
                { backgroundColor: palette.input, color: palette.text, borderColor: palette.border },
              ]}
            />
            <View style={[styles.unitBox, { borderColor: palette.border }]}>
              <Text style={{ color: palette.text, fontWeight: "700" }}>{unit}</Text>
            </View>
          </View>

          {/* Barra */}
          <Text style={[styles.label, { color: palette.sub, marginTop: 12 }]}>
            {t("Barra", "Barbell")}
          </Text>
          <BarSelector />
        </View>

        {/* Card: Resultado */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{t("Desglose por lado", "Per-side breakdown")}</Text>

          {/* Totales */}
          <View style={[styles.totals, { borderColor: palette.border, backgroundColor: isDarkMode ? "#161616" : "#FAFAFA" }]}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: palette.sub, fontSize: 12 }}>{t("Placas por lado", "Plates per side")}</Text>
              <Text style={{ color: palette.text, fontSize: 20, fontWeight: "800" }}>
                {isFinite(perSide) ? `${perSide.toFixed(2)} ${unit}` : "—"}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: palette.border }} />
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: palette.sub, fontSize: 12 }}>{t("Total usado", "Total used")}</Text>
              <Text style={{ color: palette.text, fontSize: 20, fontWeight: "800" }}>
                {isFinite(usedTotal) ? `${usedTotal.toFixed(2)} ${unit}` : "—"}
              </Text>
            </View>
          </View>

          {/* Diferencia */}
          <DiffBadge />

          {/* Visual: barra al medio y discos a ambos lados (auto-scaling + compactor) */}
          <View
            style={[styles.stackRow, { paddingHorizontal: SIDE_PADDING }]}
            onLayout={onStackLayout}
          >
            {/* LADO IZQUIERDO (interior → exterior, visible) */}
            <View style={[styles.stackSide, { flexDirection: "row-reverse" }]}>
              {sizing.compactVisual.length === 0 ? (
                <Text style={{ color: palette.sub, fontSize: 12 }}>{t("Sin placas", "No plates")}</Text>
              ) : (
                sizing.compactVisual.map((p, idx) => (
                  <View
                    key={`L-${p.value}-${idx}`}
                    style={{
                      height: sizing.plateH,
                      width: sizing.plateW,
                      borderRadius: 6,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#00000020",
                      backgroundColor: p.color,
                      marginLeft: idx === sizing.compactVisual.length - 1 ? 0 : sizing.gap,
                    }}
                  >
                    {sizing.showText && (
                      <Text style={{ fontWeight: "900", fontSize: sizing.fontSize, color: textOn(p.color) }}>
                        {p.value}{unit}
                      </Text>
                    )}
                  </View>
                ))
              )}
              {/* Badge +N si hubo compactación */}
              {sizing.compactCount > 0 && (
                <View
                  style={{
                    height: sizing.plateH,
                    width: sizing.plateW,
                    borderRadius: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#00000020",
                    backgroundColor: isDarkMode ? "#2A2A2A" : "#E5E7EB",
                    marginLeft: sizing.compactVisual.length ? sizing.gap : 0,
                  }}
                >
                  <Text style={{ fontWeight: "900", fontSize: sizing.fontSize, color: isDarkMode ? "#fff" : "#111" }}>
                    +{sizing.compactCount}
                  </Text>
                </View>
              )}
            </View>

            {/* BARRA CENTRAL */}
            <View style={[styles.barCore, { backgroundColor: palette.barMetal, width: BAR_WIDTH }]} />

            {/* LADO DERECHO (interior → exterior, visible) */}
            <View style={[styles.stackSide, { flexDirection: "row" }]}>
              {sizing.compactVisual.length === 0 ? (
                <Text style={{ color: palette.sub, fontSize: 12 }}>{t("Sin placas", "No plates")}</Text>
              ) : (
                sizing.compactVisual.map((p, idx) => (
                  <View
                    key={`R-${p.value}-${idx}`}
                    style={{
                      height: sizing.plateH,
                      width: sizing.plateW,
                      borderRadius: 6,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#00000020",
                      backgroundColor: p.color,
                      marginRight: idx === sizing.compactVisual.length - 1 ? 0 : sizing.gap,
                    }}
                  >
                    {sizing.showText && (
                      <Text style={{ fontWeight: "900", fontSize: sizing.fontSize, color: textOn(p.color) }}>
                        {p.value}{unit}
                      </Text>
                    )}
                  </View>
                ))
              )}
              {/* Badge +N también en el lado derecho */}
              {sizing.compactCount > 0 && (
                <View
                  style={{
                    height: sizing.plateH,
                    width: sizing.plateW,
                    borderRadius: 6,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#00000020",
                    backgroundColor: isDarkMode ? "#2A2A2A" : "#E5E7EB",
                    marginRight: sizing.compactVisual.length ? sizing.gap : 0,
                  }}
                >
                  <Text style={{ fontWeight: "900", fontSize: sizing.fontSize, color: isDarkMode ? "#fff" : "#111" }}>
                    +{sizing.compactCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Lista detallada */}
          <View style={{ marginTop: 10 }}>
            {breakdown.length === 0 ? (
              <Text style={{ color: palette.sub, fontSize: 12 }}>
                {t("Ajusta el objetivo o la barra.", "Adjust target or barbell.")}
              </Text>
            ) : (
              breakdown.map(({ plate, count }) => (
                <View key={plate.label} style={styles.rowLine}>
                  <View style={[styles.dot, { backgroundColor: plate.color }]} />
                  <Text style={{ color: palette.text, fontWeight: "700", flex: 1 }}>{plate.label}</Text>
                  <Text style={{ color: palette.sub, fontWeight: "700" }}>× {count}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Nota */}
        <View style={[styles.note, { borderColor: palette.border, backgroundColor: isDarkMode ? "#151515" : "#FFF" }]}>
          <Ionicons name="information-circle-outline" size={16} color={palette.accent} />
          <Text style={{ color: palette.sub, fontSize: 12, flex: 1, marginLeft: 6 }}>
            {t(
              "Los discos se escalan y, si es necesario, se agrupan con “+N” para no salir del contenedor.",
              "Plates auto-scale and group with “+N” if needed so they never overflow."
            )}
          </Text>
        </View>
      </PullToRefresh>
    </KeyboardAvoidingView>
  );
}

/** =============================
 *  Estilos
 *  =============================*/
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

  card: {
    marginTop: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },

  label: { fontSize: 12 },

  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 6,
    alignSelf: "flex-start",
  },
  segmentBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  segmentText: { fontWeight: "800" },

  row: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 6 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  unitBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  totals: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
  },

  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  /* Visual central */
  stackRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stackSide: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    flexShrink: 1,
  },
  barCore: {
    height: 84,
    borderRadius: 6,
  },

  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 6, marginRight: 8 },

  note: {
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
});
