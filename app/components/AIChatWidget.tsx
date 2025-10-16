import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendCheckin, confirmAdjustments } from "services/aiService";
import { getSessions } from "services/trainingService";

const { width, height } = Dimensions.get("window");

export type AIChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: number;
  read?: boolean;
};

export interface AIChatWidgetProps {
  userName?: string;
  role?: string;
  initialUnread?: number;
  onOpen?: () => void;
  onClose?: () => void;
}

const WIDGET_BOTTOM_OFFSET = 90;
const WIDGET_SIDE_OFFSET = 20;
const SHEET_HEIGHT = Math.min(680, height * 0.8);

export default function AIChatWidget({
  userName,
  initialUnread = 0,
  onOpen,
  onClose,
}: AIChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(initialUnread);
  const [showCheckin, setShowCheckin] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [sleep, setSleep] = useState<number>(7);
  const [fatigue, setFatigue] = useState<number>(5);
  const [stress, setStress] = useState<number>(5);
  const [pain, setPain] = useState<string>("");
  const [rpe, setRpe] = useState<number>(7);

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "sys-hello",
      role: "assistant",
      text: `¡Hola${
        userName ? ", " + userName : ""
      }! Soy tu asistente de IA. Puedes abrir el *Check-in diario* para ajustar tu sesión de hoy.`,
      createdAt: Date.now() - 1000 * 60 * 5,
      read: false,
    },
  ]);

  const [pendingAdjustments, setPendingAdjustments] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [open]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    onOpen?.();
  }, [onOpen]);
  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const pushMessage = useCallback(
    (
      msg: Omit<AIChatMessage, "id" | "createdAt"> &
        Partial<Pick<AIChatMessage, "createdAt">>
    ) => {
      const withId: AIChatMessage = {
        id: Math.random().toString(36).slice(2),
        createdAt: msg.createdAt ?? Date.now(),
        ...msg,
      };
      setMessages((prev) => [...prev, withId]);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true })
      );
    },
    []
  );

  // ---------- NUEVO: Submit Checkin con modified_exercises ----------
  const submitCheckin = useCallback(async () => {
    const payload = {
      sleep_quality: sleep,
      fatigue,
      stress,
      soreness: pain,
      last_rpe: rpe,
    };

    pushMessage({
      role: "user",
      text: `Check-in diario:\n• Sueño: ${sleep}/10\n• Fatiga: ${fatigue}/10\n• Estrés: ${stress}/10\n• Dolor/Molestias: ${
        pain || "Sin notas"
      }\n• RPE último entrenamiento: ${rpe}/10`,
      read: true,
    });

    setShowCheckin(false);
    setPain("");

    const data = await sendCheckin(payload);

    if ("error" in data) {
      pushMessage({
        role: "assistant",
        text: `❌ ${data.error}`,
        read: open,
      });
      return;
    }

    if (data.modified_exercises && data.modified_exercises.length > 0) {
      setPendingAdjustments(
        data.modified_exercises.map((ex: any) => ({
          ...ex,
          accepted: null,
          session_id: data.session_id,
        }))
      );

      // 🔹 Traemos la sesión para mostrar notes, fecha y bloque
      const sessionData = await getSessions(data.session_id);
      const sessionNotes = sessionData.notes || "Sin notas";
      const sessionDate = sessionData.date || "Sin fecha";
      const sessionBlock = sessionData.block || "Sin bloque";

      pushMessage({
        role: "assistant",
        text: `📝 Ajustes sugeridos para la sesión:\n• Bloque: ${sessionBlock}\n• Fecha: ${sessionDate}\n• Notes: "${sessionNotes}"\n${data.modified_exercises
          .map((ex: any) => `• ${ex.name}: ${ex.reason}`)
          .join("\n")}\n\nPuedes aceptar o rechazar cada ajuste.`,
        read: open,
      });
    } else {
      pushMessage({
        role: "assistant",
        text: "✅ Check-in recibido, no se requieren ajustes por ahora.",
        read: open,
      });
    }
  }, [sleep, fatigue, stress, rpe, pain, pushMessage, open]);

  const handleAdjustment = useCallback(
    async (exerciseName: string, accept: boolean) => {
      setPendingAdjustments((prev) =>
        prev.map((a) =>
          a.name === exerciseName ? { ...a, accepted: accept } : a
        )
      );

      const exerciseAdj = pendingAdjustments.find(
        (a) => a.name === exerciseName
      );
      if (!exerciseAdj) return;

      const data = await confirmAdjustments(exerciseAdj.session_id, {
        [exerciseName]: accept,
      });

      if ("error" in data) {
        pushMessage({
          role: "assistant",
          text: `❌ No se pudo aplicar el ajuste de ${exerciseName}: ${data.error}`,
          read: open,
        });
        return;
      }

      pushMessage({
        role: "assistant",
        text: accept
          ? `✅ Ajuste de ${exerciseName} aplicado correctamente.`
          : `❌ Ajuste de ${exerciseName} rechazado. Mantendremos tu planificación original.`,
        read: open,
      });
    },
    [pendingAdjustments, pushMessage, open]
  );

  const headerTitle = useMemo(() => "Asistente IA", []);

  // -------------------- RENDER --------------------
  return (
    <>
      {/* Burbuja flotante */}
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.9}
        style={styles.fab}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal centrado */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheet}
          >
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="sparkles" size={20} color="#EF233C" />
                <Text style={styles.sheetTitle}>{headerTitle}</Text>
              </View>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            {!showCheckin ? (
              <>
                <ScrollView
                  ref={scrollRef}
                  contentContainerStyle={styles.messagesContainer}
                >
                  {messages.map((m) => (
                    <View
                      key={m.id}
                      style={[
                        styles.bubble,
                        m.role === "user"
                          ? styles.bubbleUser
                          : styles.bubbleAssistant,
                      ]}
                    >
                      <Text style={styles.bubbleText}>{m.text}</Text>
                    </View>
                  ))}

                  {/* Ajustes pendientes */}
                  {pendingAdjustments.map((adj) => (
                    <View key={adj.name} style={{ marginVertical: 6 }}>
                      <Text style={{ color: "#fff" }}>
                        • {adj.name}: {adj.sets}x{adj.reps}, {adj.weight}kg, RPE{" "}
                        {adj.rpe} ({adj.reason})
                      </Text>
                      {adj.accepted === null && (
                        <View
                          style={{ flexDirection: "row", gap: 8, marginTop: 4 }}
                        >
                          <TouchableOpacity
                            style={[
                              styles.submitBtn,
                              { backgroundColor: "#28a745" },
                            ]}
                            onPress={() => handleAdjustment(adj.name, true)}
                          >
                            <Text style={styles.submitText}>Aceptar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.submitBtn,
                              { backgroundColor: "#dc3545" },
                            ]}
                            onPress={() => handleAdjustment(adj.name, false)}
                          >
                            <Text style={styles.submitText}>Rechazar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>

                {/* Botón Check-in */}
                <View style={[styles.inputBar, { justifyContent: "center" }]}>
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => setShowCheckin(true)}
                  >
                    <Ionicons
                      name="clipboard-outline"
                      size={18}
                      color="#EF233C"
                    />
                    <Text style={styles.toolbarText}>Check-in</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <ScrollView contentContainerStyle={styles.checkinContainer}>
                <View style={styles.checkinHeader}>
                  <Text style={styles.checkinTitle}>Check-in diario</Text>
                  <TouchableOpacity
                    style={styles.toolbarBtn}
                    onPress={() => setShowCheckin(false)}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={18}
                      color="#EF233C"
                    />
                    <Text style={styles.toolbarText}>Volver al chat</Text>
                  </TouchableOpacity>
                </View>

                <NumberRow
                  label="¿Cómo dormiste anoche?"
                  value={sleep}
                  setValue={setSleep}
                />
                <NumberRow
                  label="¿Qué tan fatigado/a te sientes ahora?"
                  value={fatigue}
                  setValue={setFatigue}
                />
                <NumberRow
                  label="¿Nivel de estrés hoy?"
                  value={stress}
                  setValue={setStress}
                />
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>
                    ¿Tienes dolor o molestias musculares/articulares?
                  </Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Describe brevemente (opcional)"
                    placeholderTextColor="#777"
                    value={pain}
                    onChangeText={setPain}
                    multiline
                  />
                </View>
                <NumberRow
                  label="RPE promedio del día anterior"
                  value={rpe}
                  setValue={setRpe}
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={submitCheckin}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#121212" />
                  <Text style={styles.submitText}>Enviar check-in</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

// -------------------- COMPONENTES AUX --------------------
function NumberRow({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>
        {label} <Text style={{ color: "#EF233C" }}>({value}/10)</Text>
      </Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => setValue(Math.max(1, value - 1))}
        >
          <Ionicons name="remove" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.stepValue}>
          <Text style={styles.stepValueText}>{value}</Text>
        </View>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => setValue(Math.min(10, value + 1))}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingBottom: 80,
  },
  sheet: {
    backgroundColor: "#121212",
    borderRadius: 16,
    paddingBottom: 12,
    width: width * 0.9,
    maxHeight: SHEET_HEIGHT,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(239,35,60,0.35)",
    overflow: "hidden",
    shadowColor: "#EF233C",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fab: {
    position: "absolute",
    right: WIDGET_SIDE_OFFSET,
    bottom: WIDGET_BOTTOM_OFFSET,
    backgroundColor: "#EF233C",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#1E1E1E",
    borderColor: "#EF233C",
    borderWidth: 1,
    height: 20,
    minWidth: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: "#222",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: width * 0.8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "#EF233C" },
  bubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#262626",
  },
  bubbleText: { color: "#fff", fontSize: 14, lineHeight: 19 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopColor: "#222",
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 8,
  },
  toolbarBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#262626",
  },
  toolbarText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
  },
  checkinContainer: { padding: 16, gap: 12 },
  checkinHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  checkinTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  fieldBlock: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#262626",
  },
  fieldLabel: {
    color: "#ddd",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  fieldInput: {
    backgroundColor: "#161616",
    borderRadius: 10,
    padding: 10,
    color: "#fff",
    minHeight: 44,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepBtn: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stepValue: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#222",
  },
  stepValueText: { color: "#fff", fontWeight: "700" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF233C",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  submitText: { color: "#121212", fontWeight: "700", marginLeft: 6 },
  checkinContainerScroll: { paddingBottom: 50 },
});