// app/calculadora/index.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "app/context/appContext";

/** =============================
 *  Utilidades RPE / e1RM (OpenPowerlifting-like)
 *  =============================*/

// RPEs de columna (alto → bajo)
const RPE_COLS = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6] as const;

/**
 * Matriz de %1RM (0–1) por reps (1..12) x RPE (RPE_COLS),
 * basada en la tabla de Mike Tuchscherer (estándar de muchas calculadoras públicas).
 */
const TABLE: Record<number, number[]> = {
  1:  [1.000, 0.980, 0.955, 0.939, 0.922, 0.907, 0.892, 0.878, 0.864],
  2:  [0.955, 0.939, 0.922, 0.907, 0.892, 0.878, 0.864, 0.850, 0.837],
  3:  [0.922, 0.907, 0.892, 0.878, 0.864, 0.850, 0.837, 0.824, 0.811],
  4:  [0.892, 0.878, 0.864, 0.850, 0.837, 0.824, 0.811, 0.798, 0.786],
  5:  [0.863, 0.850, 0.837, 0.824, 0.811, 0.798, 0.786, 0.774, 0.762],
  6:  [0.837, 0.824, 0.811, 0.798, 0.786, 0.774, 0.762, 0.751, 0.739],
  7:  [0.811, 0.798, 0.786, 0.774, 0.762, 0.751, 0.739, 0.728, 0.717],
  8:  [0.786, 0.774, 0.762, 0.751, 0.739, 0.728, 0.717, 0.706, 0.695],
  9:  [0.762, 0.751, 0.739, 0.728, 0.717, 0.706, 0.695, 0.684, 0.674],
 10:  [0.739, 0.728, 0.717, 0.706, 0.695, 0.684, 0.674, 0.663, 0.653],
 11:  [0.717, 0.706, 0.695, 0.684, 0.674, 0.663, 0.653, 0.643, 0.633],
 12:  [0.695, 0.684, 0.674, 0.663, 0.653, 0.643, 0.633, 0.623, 0.613],
};

// helpers
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Interpolación bilineal sobre la tabla para soportar RPE y reps decimales:
 * - Rango clamp: reps 1..12, RPE 6..10
 */
function percentOf1RM(reps: number, rpe: number): number {
  const r = clamp(reps, 1, 12);
  const cVal = clamp(rpe, 6, 10);

  // descomposición de reps
  const r0 = Math.floor(r);
  const r1 = Math.ceil(r);
  const rT = r1 === r0 ? 0 : (r - r0) / (r1 - r0);

  // posición continua de RPE entre columnas
  const findColPos = (val: number) => {
    const idx = RPE_COLS.indexOf(val as any);
    if (idx >= 0) return idx;
    for (let i = 0; i < RPE_COLS.length - 1; i++) {
      const hi = RPE_COLS[i], lo = RPE_COLS[i + 1];
      if (val <= hi && val >= lo) {
        const t = (hi - val) / (hi - lo); // 0 en hi → 1 en lo
        return i + t;
      }
    }
    return val > 10 ? 0 : RPE_COLS.length - 1;
  };

  const colPos = findColPos(cVal);
  const c0 = Math.floor(colPos);
  const c1 = Math.ceil(colPos);
  const cT = c1 === c0 ? 0 : (colPos - c0) / (c1 - c0);

  const get = (rr: number, cc: number) => TABLE[rr as 1][cc];

  // cuatro esquinas
  const v00 = get(r0, c0);
  const v01 = get(r0, c1);
  const v10 = get(r1, c0);
  const v11 = get(r1, c1);

  // interp RPE en cada fila y luego interp reps entre filas
  const top = lerp(v00, v01, cT);
  const bot = lerp(v10, v11, cT);
  return lerp(top, bot, rT);
}

/** e1RM = weight / (%1RM) */
function estimate1RM(weight: number, reps: number, rpe: number): number {
  const pct = percentOf1RM(reps, rpe);
  return pct > 0 ? weight / pct : NaN;
}

/** =============================
 *  Screen Calculadora
 *  =============================*/
export default function CalculadoraScreen() {
  const router = useRouter();
  const { isDarkMode, language } = useAppContext();

  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        surface: "#1E1E1E",
        input: "#1A1A1A",
        text: "#FFFFFF",
        subtext: "#AAAAAA",
        border: "#2A2A2A",
        accent: "#EF233C",
      }
    : {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        input: "#FFFFFF",
        text: "#111111",
        subtext: "#4B5563",
        border: "#E5E7EB",
        accent: "#EF233C",
      };

  // Inputs "Tengo"
  const [haveWeight, setHaveWeight] = useState<string>("");
  const [haveReps, setHaveReps] = useState<string>("");
  const [haveRpe, setHaveRpe] = useState<string>("8");

  const e1rm = useMemo(() => {
    const w = parseFloat(haveWeight.replace(",", "."));
    const r = parseFloat(haveReps);
    const p = parseFloat(haveRpe);
    if (!isFinite(w) || !isFinite(r) || !isFinite(p) || w <= 0 || r <= 0) return NaN;
    return estimate1RM(w, r, p);
  }, [haveWeight, haveReps, haveRpe]);

  const t = (es: string, en: string) => (language === "es" ? es : en);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {t("Calculadora 1RM (RPE)", "1RM Calculator (RPE)")}
          </Text>
        </View>

        {/* Body centrado */}
        <View style={styles.body}>
          {/* Descripción ARRIBA del container */}
          <View style={[styles.tips, { borderColor: palette.border, marginBottom: 16 }]}>
            <Text style={{ color: palette.subtext, fontSize: 12, lineHeight: 18 }}>
              {t(
                "Calculadora que da un peso estimado a 1 repetición máxima.",
                "Calculator that estimates your one-rep max."
              )}
            </Text>
          </View>

          {/* Card: Tengo */}
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{t("Tengo", "Have")}</Text>

            <View style={styles.row}>
              <View style={styles.col}>
                {/* Label: Peso en barra + unidad kg en la barra */}
                <Text style={[styles.label, { color: palette.subtext }]}>{t("Peso en barra", "Bar weight")}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={haveWeight}
                    onChangeText={setHaveWeight}
                    placeholder="e.g. 140"
                    placeholderTextColor={palette.subtext}
                    style={[
                      styles.input,
                      {
                        backgroundColor: palette.input,
                        color: palette.text,
                        borderColor: palette.border,
                        paddingRight: 48, // espacio para "kg"
                      },
                    ]}
                  />
                  <Text style={[styles.unitBadge, { color: palette.subtext }]}>kg</Text>
                </View>
              </View>

              <View style={styles.col}>
                <Text style={[styles.label, { color: palette.subtext }]}>{t("Reps", "Reps")}</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={haveReps}
                  onChangeText={setHaveReps}
                  placeholder="e.g. 3"
                  placeholderTextColor={palette.subtext}
                  style={[
                    styles.input,
                    { backgroundColor: palette.input, color: palette.text, borderColor: palette.border },
                  ]}
                />
              </View>

              <View style={styles.col}>
                <Text style={[styles.label, { color: palette.subtext }]}>RPE</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={haveRpe}
                  onChangeText={setHaveRpe}
                  placeholder="6–10"
                  placeholderTextColor={palette.subtext}
                  style={[
                    styles.input,
                    { backgroundColor: palette.input, color: palette.text, borderColor: palette.border },
                  ]}
                />
              </View>
            </View>

            {/* Resultado e1RM */}
            <View style={[styles.resultBox, { borderColor: palette.border }]}>
              <Text style={[styles.resultLabel, { color: palette.subtext }]}>
                {t("1RM estimado", "Estimated 1RM")}
              </Text>
              <Text style={[styles.resultValue, { color: palette.accent }]}>
                {isFinite(e1rm) ? `${e1rm.toFixed(1)} kg` : t("— ingresa valores —", "— enter values —")}
              </Text>
            </View>
          </View>

          {/* Nota al final */}
          <View style={[styles.tips, { borderColor: palette.border }]}>
            <Text style={{ color: palette.subtext, fontSize: 12, lineHeight: 18 }}>
              {t(
                "Nota: el cálculo usa una tabla RPE→%1RM y la precisión puede variar entre atletas y ejercicios.",
                "Note: this uses an RPE→%1RM table; accuracy varies between athletes and lifts."
              )}
            </Text>
          </View>
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

  // El ScrollView ocupa el alto total y permite centrar el body
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Centra verticalmente card + tips (el header queda arriba)
  body: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  card: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },

  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },

  label: { fontSize: 12, marginBottom: 6 },

  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  unitBadge: {
    position: "absolute",
    right: 12,
    top: 10,
    fontSize: 14,
  },

  resultBox: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  resultLabel: { fontSize: 12, marginBottom: 2 },
  resultValue: { fontSize: 22, fontWeight: "800" },

  tips: {
    marginTop: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
});
