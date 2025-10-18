import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Animated,
  Easing,
  RefreshControl,
  ScrollViewProps,
  Text,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppContext } from "app/context/appContext";

type Props = {
  onRefresh?: () => Promise<void> | void;
  children: React.ReactNode;
  accentColor?: string;
  bannerColor?: string;
  isDarkMode?: boolean;
  useNativeControl?: boolean;
  threshold?: number;
  progressViewOffset?: number;
  indicatorSize?: number;
  indicatorTopOffset?: number;
  bannerTopOffset?: number;
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
  // En Android usamos el control nativo por fiabilidad del gesto
  useNativeControl = Platform.OS === "android",
  threshold = 70,
  progressViewOffset,
  indicatorSize,
  indicatorTopOffset,
  bannerTopOffset,
  hardRemount = true,
  contentContainerStyle,
  style,
  showsVerticalScrollIndicator = false,
  alwaysBounceVertical = true,
  bounces = true,
  overScrollMode = "always",
}: Props) {
  const { isDarkMode: ctxDark, language } = useAppContext();
  const dark = isDarkMode ?? ctxDark;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useLocalSearchParams();
  

  const [refreshing, setRefreshing] = useState(false);
  const pullY = useRef(new Animated.Value(0)).current;
  const lastPullRef = useRef(0);
  const updatedOpacity = useRef(new Animated.Value(0)).current;
  const updatedTranslate = useRef(new Animated.Value(-10)).current;

  const pullOpacity = pullY.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const pullRotate = pullY.interpolate({
    inputRange: [0, 100],
    outputRange: ["0deg", "180deg"],
    extrapolate: "clamp",
  });
  // Simple spinner style: sin anillo de progreso ni parallax

  

  // Platform-aware sizing and offsets
  const iconSize = indicatorSize ?? Platform.select({ ios: 24, android: 28, default: 26 });
  const topOffset = indicatorTopOffset ?? (insets.top + (Platform.OS === "ios" ? 6 : 10));
  const bannerOffset = bannerTopOffset ?? (topOffset + (typeof iconSize === "number" ? iconSize : 26) + 12);
  const nativeOffset = progressViewOffset ?? Math.max(40, topOffset);
  const showCustomIndicator = !useNativeControl; // evita doble indicador cuando usamos nativo

  // No spinning animation loop needed; ActivityIndicator handles it

  const doRefresh = async () => {
    try {
      setRefreshing(true);
      updatedOpacity.stopAnimation();
      updatedOpacity.setValue(0);
      updatedTranslate.setValue(-10);
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
          // replace to same route with a busting param to force remount
          router.replace({ pathname, params } as any);
          return;
        } catch {}
      }
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Animated.sequence([
        Animated.parallel([
          Animated.timing(updatedOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.timing(updatedTranslate, { toValue: 0, duration: 160, useNativeDriver: true }),
        ]),
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(updatedOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(updatedTranslate, { toValue: -10, duration: 220, useNativeDriver: true }),
        ]),
      ]).start();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Indicador personalizado (solo si no usamos el nativo) */}
      {showCustomIndicator && refreshing && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: topOffset,
            left: 0,
            right: 0,
            zIndex: 10,
            elevation: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator
            size={(iconSize as number) <= 24 ? "small" : "large"}
            color={accentColor ?? "#EF233C"}
          />
        </View>
      )}

      {/* Banner Actualizado */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: bannerOffset,
          left: 0,
          right: 0,
          zIndex: 9,
          elevation: 9,
          alignItems: "center",
          opacity: updatedOpacity,
          transform: [{ translateY: updatedTranslate }],
        }}
      >
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: bannerColor ?? "#22c55e",
            borderRadius: 16,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {language === "es" ? "Actualizado" : "Updated"}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        refreshControl={
          useNativeControl ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={doRefresh}
              tintColor={accentColor ?? "#EF233C"}
              colors={[accentColor ?? "#EF233C"]}
              progressBackgroundColor={dark ? "#1E1E1E" : "#FFFFFF"}
              progressViewOffset={nativeOffset}
            />
          ) : undefined
        }
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          if (y < 0) {
            const d = -y;
            pullY.setValue(d);
            lastPullRef.current = d;
          } else {
            pullY.setValue(0);
            lastPullRef.current = 0;
          }
        }}
        onScrollEndDrag={() => {
          // Si usamos el control nativo, no disparamos manual para evitar duplicidad
          if (!useNativeControl && !refreshing && lastPullRef.current > threshold) {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
            doRefresh();
          }
          lastPullRef.current = 0;
        }}
        scrollEventThrottle={16}
        alwaysBounceVertical={alwaysBounceVertical}
        bounces={bounces}
        overScrollMode={overScrollMode}
      >
        {children}
      </ScrollView>
    </View>
  );
}
