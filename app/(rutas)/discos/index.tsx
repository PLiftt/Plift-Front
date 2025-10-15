// app/(rutas)/discos/index.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppContext } from "app/context/appContext";

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
  // Colores genéricos en lb (frecuente que sean negros o mixtos)
  { value: 45, color: "#111111", label: "45 lb" },
  { value: 35, color: "#333333", label: "35 lb" },
  { value: 25, color: "#555555", label: "25 lb" },
  { value: 10, color: "#777777", label: "10 lb" },
  { value: 5,  color: "#999999", label: "5 lb"  },
  { value: 2.5,color: "#B8B8B8", label: "2.5 lb" },
  { value: 1.25,color:"#C8C8C8", label: "1.25 lb" },
];

/** Conversión */
const kg2lb = (kg: number) => kg * 2.2046226218;
const lb2kg = (lb: number) => lb / 2.2046226218;

/** Redondeo al incremento más cercano */
const roundTo = (x: number, step: number) => Math.round(x / step) * step;

type Unit = "kg" | "lb";

// Selecciones de barra por unidad
const BAR_OPTIONS_KG = [20, 15, 10];
const BAR_OPTIONS_LB = [45, 35, 22];

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
      }
    : {
        bg: "#F8FAFC",
        surface: "#FFFFFF",
        text: "#111111",
        sub: "#4B5563",
        border: "#E5E7EB",
        accent: "#EF233C",
        input: "#FFFFFF",
      };

  /** =============================
   *  Inputs
   *  =============================*/
  const [unit, setUnit] = useState<Unit>("kg");
  const [target, setTarget] = useState<string>("140");           // peso objetivo total (con barra)
  const [bar, setBar] = useState<number>(20);                    // peso de la barra
  const [collars, setCollars] = useState<string>("0");           // peso total de collares (sumados ambos)
  const [step, setStep] = useState<string>(unit === "kg" ? "0.5" : "1"); // redondeo

  // al cambiar unidad, ajusta barra y step por defecto
  const onUnitChange = (u: Unit) => {
    setUnit(u);
    if (u === "kg") {
      setBar(20);
      setStep("0.5");
    } else {
      setBar(45);
      setStep("1");
    }
  };

  /** =============================
   *  Cálculo
   *  =============================*/
  const { perSide, usedTotal, diff, breakdown, visual } = useMemo(() => {
    const tRaw = parseFloat((target || "").replace(",", "."));
    const stepNum = parseFloat((step || "").replace(",", "."));
    const collarsNum = parseFloat((collars || "").replace(",", "."));
    if (!isFinite(tRaw) || !isFinite(stepNum) || stepNum <= 0) {
      return { perSide: NaN, usedTotal: NaN, diff: NaN, breakdown: [] as { plate: Plate; count: number }[], visual: [] as Plate[] };
    }

    const plates = unit === "kg" ? KG_PLATES : LB_PLATES;
    // Aseguramos que barra y collares estén en la unidad actual
    const barW = bar;
    const collarsW = isFinite(collarsNum) && collarsNum > 0 ? collarsNum : 0;

    // Redondeo del objetivo al incremento global de la unidad
    const roundedTarget = roundTo(tRaw, stepNum);

    // carga por lado:
    let perSideLoad = (roundedTarget - barW - collarsW) / 2;

    // Si carga por lado es negativa, imposible
    if (!isFinite(perSideLoad) || perSideLoad < 0) {
      return { perSide: NaN, usedTotal: NaN, diff: NaN, breakdown: [], visual: [] };
    }

    // Greedy: usar placas de mayor a menor
    const list: { plate: Plate; count: number }[] = [];
    let rem = perSideLoad;

    for (const p of plates) {
      const n = Math.floor(rem / p.value + 1e-9); // número de placas de ese valor por lado
      if (n > 0) {
        list.push({ plate: p, count: n });
        rem -= n * p.value;
      }
    }

    // Ajuste por redondeo residual: si queda muy poco remanente, se ignora
    const usedPerSide = perSideLoad - rem;
    const totalUsed = usedPerSide * 2 + barW + collarsW;
    const delta = totalUsed - roundedTarget;

    // Visual simple: array plano de placas (por lado) de mayor a menor para el stack
    const vis: Plate[] = list.flatMap(({ plate, count }) => Array.from({ length: count }, () => plate));

    return {
      perSide: usedPerSide,
      usedTotal: totalUsed,
      diff: delta, // positivo: sobró; negativo: faltó
      breakdown: list,
      visual: vis,
    };
  }, [unit, target, bar, step, collars]);

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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
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

          {/* Collares + Redondeo */}
          <View style={[styles.row, { marginTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: palette.sub }]}>{t("Collares (total)", "Collars (total)")}</Text>
              <TextInput
                keyboardType="decimal-pad"
                value={collars}
                onChangeText={setCollars}
                placeholder={unit === "kg" ? "0 (p. ej. 2.5)" : "0 (e.g. 5)"}
                placeholderTextColor={palette.sub}
                style={[
                  styles.input,
                  { backgroundColor: palette.input, color: palette.text, borderColor: palette.border },
                ]}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: palette.sub }]}>{t("Redondeo", "Rounding step")}</Text>
              <TextInput
                keyboardType="decimal-pad"
                value={step}
                onChangeText={setStep}
                placeholder={unit === "kg" ? "0.5" : "1"}
                placeholderTextColor={palette.sub}
                style={[
                  styles.input,
                  { backgroundColor: palette.input, color: palette.text, borderColor: palette.border },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Card: Resultado */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>
            {t("Desglose por lado", "Per-side breakdown")}
          </Text>

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

          {/* Diferencia (si no es exacto) */}
          <DiffBadge />

          {/* Visual stack simple */}
          <View style={styles.stackRow}>
            <View style={[styles.barCore, { backgroundColor: isDarkMode ? "#999" : "#444" }]} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
              {visual.length === 0 && (
                <Text style={{ color: palette.sub, fontSize: 12 }}>
                  {t("Sin placas", "No plates")}
                </Text>
              )}
              {visual.map((p, idx) => (
                <View key={`${p.value}-${idx}`} style={[styles.plateVis, { backgroundColor: p.color, borderColor: "#00000020" }]}>
                  <Text style={[styles.plateVisText]}>
                    {p.value}{unit}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Lista detallada */}
          <View style={{ marginTop: 10 }}>
            {breakdown.length === 0 ? (
              <Text style={{ color: palette.sub, fontSize: 12 }}>
                {t("Ajusta el objetivo o el redondeo.", "Adjust target or rounding.")}
              </Text>
            ) : (
              breakdown.map(({ plate, count }) => (
                <View key={plate.label} style={styles.rowLine}>
                  <View style={[styles.dot, { backgroundColor: plate.color }]} />
                  <Text style={{ color: palette.text, fontWeight: "700", flex: 1 }}>
                    {plate.label}
                  </Text>
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
              "El cálculo usa greedy de mayor a menor. Si tu gimnasio no tiene ciertas placas, ajusta el redondeo o el objetivo.",
              "We use a greedy largest-first approach. If your gym lacks some plates, tweak rounding or target weight."
            )}
          </Text>
        </View>
      </ScrollView>
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

  stackRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barCore: {
    width: 14,
    height: 72,
    borderRadius: 6,
  },
  plateVis: {
    height: 72,
    width: 36,
    borderRadius: 6,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  plateVisText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 10,
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
