import React, { useRef, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  ScrollViewProps,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAppContext } from "app/context/appContext";

type Props = {
  onRefresh?: () => Promise<void> | void;
  children: React.ReactNode;
  accentColor?: string;
  isDarkMode?: boolean;
  useNativeControl?: boolean;
  threshold?: number;
  progressViewOffset?: number;
  indicatorSize?: number;
  indicatorTopOffset?: number;
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
  isDarkMode,
  useNativeControl = false,
  threshold = 70,
  progressViewOffset,
  indicatorSize,
  indicatorTopOffset,
  hardRemount = true,
  contentContainerStyle,
  style,
  showsVerticalScrollIndicator = false,
  alwaysBounceVertical = true,
  bounces = true,
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

  const iconSize =
    indicatorSize ?? Platform.select({ ios: 24, android: 28, default: 26 });
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

  return (
    <View style={{ flex: 1 }}>
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
          if (useNativeControl) return; // el nativo maneja el gesto
          const y = e.nativeEvent.contentOffset.y;
          if (y < 0) {
            lastPullRef.current = -y;
          } else {
            lastPullRef.current = 0;
          }
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
        alwaysBounceVertical={alwaysBounceVertical}
        bounces={bounces}
        overScrollMode={overScrollMode}
      >
        {!useNativeControl && refreshing && (
          <View
            style={{
              paddingTop: topPad,
              paddingBottom: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: dark
                  ? "rgba(22,22,22,0.92)"
                  : "rgba(255,255,255,0.96)",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: (accentColor ?? "#EF233C") + "22",
                // Sombra iOS
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                // Elevación Android
                elevation: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator
                size={(iconSize as number) <= 24 ? "small" : "large"}
                color={accentColor ?? "#EF233C"}
              />
            </View>
          </View>
        )}

        {children}
      </ScrollView>
    </View>
  );
}
