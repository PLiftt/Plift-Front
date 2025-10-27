import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { on, CoachEventPayload } from "app/lib/eventBus";

type ToastType = "info" | "success" | "warn" | "error";

type ShowOptions = {
  type?: ToastType;
  durationMs?: number;
  onPress?: () => void;
};

type ToastContextType = {
  show: (message: string, options?: ShowOptions) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const translateY = useRef(new Animated.Value(-120)).current;
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  const palette = useMemo(() => {
    return {
      info: { bg: "#111827", text: "#FFFFFF" },
      success: { bg: "#16a34a", text: "#FFFFFF" },
      warn: { bg: "#d97706", text: "#FFFFFF" },
      error: { bg: "#dc2626", text: "#FFFFFF" },
    } as const;
  }, []);

  const hide = useCallback((immediate = false) => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    const run = () => {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setVisible(false));
    };
    if (immediate) run();
    else run();
  }, [translateY]);

  const show = useCallback(
    (msg: string, options?: ShowOptions) => {
      const { type = "info", durationMs = 2500 } = options || {};
      setMessage(msg);
      setType(type);
      setVisible(true);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      translateY.setValue(-120);
      Animated.timing(translateY, {
        toValue: Platform.select({ ios: 0, android: 0, default: 0 }),
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      hideTimeout.current = setTimeout(() => hide(), durationMs);
    },
    [hide, translateY]
  );

  // Escucha eventos y SOLO muestra banner (no agenda noti local para evitar bucle)
  useEffect(() => {
    const unsub = on<CoachEventPayload>("coach-event", (data) => {
      if (!data) return;
      if (data.event === "NEW_BLOCK") {
        show("Nuevo bloque asignado", { type: "success" });
      } else if (data.event === "NEW_SESSION") {
        show("Nueva sesión disponible", { type: "info" });
      }
    });
    return () => {
      unsub?.();
    };
  }, [show]);

  useEffect(() => () => hide(true), [hide]);

  return (
    <ToastContext.Provider value={{ show }}>
      <View style={{ flex: 1 }}>
        {children}
        {visible && (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.container,
              { transform: [{ translateY }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => hide()}
              style={[styles.toast, { backgroundColor: palette[type].bg }]}
            >
              <Text style={[styles.text, { color: palette[type].text }]} numberOfLines={2}>
                {message}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.select({ ios: 48, android: 28, default: 28 }),
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    marginHorizontal: 6,
    minWidth: 200,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default ToastProvider;
