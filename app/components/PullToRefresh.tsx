import React, { useRef, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  ScrollViewProps,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAppContext } from "app/context/appContext";

type Props = {
  onRefresh?: () => Promise<void> | void;
  children: React.ReactNode;
  accentColor?: string;
  bannerColor?: string;
  isDarkMode?: boolean;

  /** Por defecto AHORA es true para usar el control nativo en ambas plataformas */
  useNativeControl?: boolean;

  /** Solo para modo custom */
  threshold?: number;
  progressViewOffset?: number;
  indicatorSize?: number;
  indicatorTopOffset?: number;

  /** Si no quieres el replace() post-refresh, pon false */
  hardRemount?: boolean;

  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  style?: ScrollViewProps["style"];
  showsVerticalScrollIndicator?: boolean;
  alwaysBounceVertical?: boolean;
  bounces?: boolean;
  overScrollMode?: ScrollViewProps["overScrollMode"];
};

export default function PullToRefresh({
  onRefresh,
  children,
  accentColor,
  bannerColor,
  isDarkMode,

  // ✅ ahora nativo por defecto (mejor UX cross-platform)
  useNativeControl = true,

  threshold = 70,
  progressViewOffset,
  indicatorSize,
  indicatorTopOffset,
  hardRemount = true,
  contentContainerStyle,
  style,
  showsVerticalScrollIndicator = false,

  // iOS: se recomienda true
  alwaysBounceVertical = true,
  bounces = true,

  // Android: se recomienda "always"
  overScrollMode = "always",
}: Props) {
  const { isDarkMode: ctxDark } = useAppContext();
  const dark = isDarkMode ?? ctxDark;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useLocalSearchParams();

  const [refreshing, setRefreshing] = useState(false);
  const lastPullRef = useRef(0);

  const { height: winH } = Dimensions.get("window");

  // Colores con fallback
  const accent = accentColor ?? "#EF233C";
  const banner = bannerColor ?? "#22c55e";

  // Tamaño/offsets por plataforma
  const iconSize =
    indicatorSize ?? Platform.select({ ios: 24, android: 28, default: 26 });

  // offset de la ruedita nativa considerando notch/statusbar
  const topOffsetBase =
    indicatorTopOffset ?? (Platform.OS === "ios" ? insets.top : insets.top + 4);

  const topPad = Math.max(0, topOffsetBase - 8);
  const nativeOffset = progressViewOffset ?? Math.max(32, topOffsetBase);

  const doRefresh = async () => {
    try {
      setRefreshing(true);
      if (onRefresh) {
        await onRefresh();
      } else {
        await new Promise((r) => setTimeout(r, 450));
      }
    } finally {
      setRefreshing(false);
      if (hardRemount) {
        try {
          const stamp = Date.now().toString();
          const params: Record<string, any> = { ...searchParams, _r: stamp };
          router.replace({ pathname, params } as any);
          return;
        } catch {}
      }
      try {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch {}
    }
  };

  // 👇 Asegura que el scroll “tire” aunque el contenido sea corto
  const mergedContentContainerStyle = [
    { minHeight: winH + 1, paddingBottom: 0 },
    contentContainerStyle,
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={style}
        contentContainerStyle={mergedContentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps="handled"
        // iOS: que el push-to-refresh funcione suave
        alwaysBounceVertical={alwaysBounceVertical}
        bounces={bounces}
        // Android: habilita overscroll
        overScrollMode={overScrollMode}
        // Android nested scroll (seguro aunque no lo necesites)
        nestedScrollEnabled={true}
        refreshControl={
          useNativeControl ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={doRefresh}
              // iOS spinner color:
              tintColor={accent}
              // Android spinner/color de progreso:
              colors={[accent]}
              progressBackgroundColor={dark ? "#1E1E1E" : "#FFFFFF"}
              progressViewOffset={nativeOffset}
            />
          ) : undefined
        }
        onScroll={(e) => {
          if (useNativeControl) return; // el nativo maneja el gesto
          const y = e.nativeEvent.contentOffset.y;
          lastPullRef.current = y < 0 ? -y : 0;
        }}
        onScrollEndDrag={() => {
          if (useNativeControl) return;
          if (!refreshing && lastPullRef.current > threshold) {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            doRefresh();
          }
          lastPullRef.current = 0;
        }}
        scrollEventThrottle={16}
      >
        {/* Indicador visual en modo custom */}
        {!useNativeControl && refreshing && (
          <View
            style={{
              paddingTop: topPad,
              paddingBottom: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* barrita/banner superior */}
            <View
              style={{
                height: 6,
                backgroundColor: banner,
                borderRadius: 999,
                marginBottom: 10,
                marginHorizontal: 20,
                alignSelf: "stretch",
              }}
            />
            {/* pill con spinner */}
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: dark
                  ? "rgba(22,22,22,0.92)"
                  : "rgba(255,255,255,0.96)",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: banner + "66",
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator
                size={(iconSize as number) <= 24 ? "small" : "large"}
                color={accent}
              />
            </View>
          </View>
        )}

        {children}
      </ScrollView>
    </View>
  );
}
