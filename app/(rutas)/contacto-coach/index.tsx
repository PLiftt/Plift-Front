// app/(rutas)/contacto-coach/index.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppContext } from "app/context/appContext";
import BottomNav from "../../components/bottomNav";

type Attachment = { uri: string; name?: string; type?: string };

export default function ContactCoachScreen() {
  const navigation = useNavigation();
  const { isDarkMode, language } = useAppContext();
  const t = (es: string, en: string) => (language === "es" ? es : en);

  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        card: "#1F1F1F",
        input: "#111",
        text: "#fff",
        subtext: "#ccc",
        placeholder: "#888",
        borderErr: "#d00000",
        accent: "#EF233C",
        neutralBtn: "#555",
      }
    : {
        background: "#F8FAFC",
        card: "#FFFFFF",
        input: "#FFFFFF",
        text: "#111827",
        subtext: "#6B7280",
        placeholder: "#9CA3AF",
        borderErr: "#dc2626",
        accent: "#EF233C",
        neutralBtn: "#374151",
      };

  const [yourEmail, setYourEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);

  const messageRef = useRef<TextInput>(null);
  const SUBJECT_MAX = 120;
  const MESSAGE_MAX = 2000;
  const ATTACH_MAX = 4;

  async function sendContactEmail(_: any) {
    return new Promise((r) => setTimeout(r, 800));
  }

  const canSend =
    subject.trim().length >= 3 &&
    message.trim().length >= 10 &&
    subject.trim().length <= SUBJECT_MAX &&
    message.trim().length <= MESSAGE_MAX &&
    !sending;

  const requestMediaPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("Permiso denegado", "Permission denied"),
        t("Necesitamos acceso a tus fotos para adjuntar imágenes.", "We need photo library access to attach images.")
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const ok = await requestMediaPermissions();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: ATTACH_MAX - attachments.length,
    });
    if (!result.canceled) {
      const newOnes: Attachment[] = result.assets.map((a, i) => ({
        uri: a.uri,
        name: a.fileName || `attachment-${Date.now()}-${i}.jpg`,
        type: a.mimeType || "image/jpeg",
      }));
      setAttachments((prev) => [...prev, ...newOnes].slice(0, ATTACH_MAX));
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (!canSend) {
      Alert.alert(
        t("Formulario incompleto", "Incomplete form"),
        t("Revisa asunto (≥3) y mensaje (≥10) antes de enviar.", "Check subject (≥3) and message (≥10) before sending.")
      );
      return;
    }
    try {
      setSending(true);
      await sendContactEmail({});
      Alert.alert(
        t("Enviado", "Sent"),
        t("Tu mensaje fue enviado. Te contactaremos al correo indicado.", "Your message was sent. We'll reply to your email.")
      );
      setYourEmail(""); setSubject(""); setMessage(""); setAttachments([]);
    } catch (e) {
      Alert.alert(
        t("Ups, algo falló", "Something went wrong"),
        t("No pudimos enviar tu mensaje. Intenta nuevamente.", "We couldn't send your message. Please try again.")
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {/* 🔙 Botón Volver arriba del container */}
        <View style={{ marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backInline}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={palette.text} />
            <Text style={{ color: palette.text, marginLeft: 8, fontWeight: "600" }}>
              {language === "es" ? "Volver" : "Back"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🧰 Container único */}
        <View style={[styles.card, { backgroundColor: palette.card }]}>
          {/* Copy */}
          <Text style={styles.bodyText}>
            <Text style={{ color: palette.text, fontWeight: "600" }}>
              {language === "es" ? "Completa el formulario" : "Fill out the form"}
            </Text>
            <Text style={{ color: palette.subtext }}>
              {language === "es" ? " te responderemos al correo indicado." : " we’ll reply to your email."}
            </Text>
          </Text>

          {/* ⬇️ separo más el primer campo */}
          <Text
            style={[
              styles.label,
              { color: palette.subtext, marginTop: 16 }  // ⬅️ aquí el ajuste
            ]}
          >
            {t("Tu correo (opcional)", "Your email (optional)")}
          </Text>
          <TextInput
            value={yourEmail}
            onChangeText={setYourEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t("ej. nombre@correo.com", "e.g. name@email.com")}
            placeholderTextColor={palette.placeholder}
            style={[styles.input, { backgroundColor: palette.input, color: palette.text }]}
            returnKeyType="next"
            onSubmitEditing={() => messageRef.current?.focus()}
          />

          <Text style={[styles.label, { color: palette.subtext, marginTop: 12 }]}>{t("Asunto", "Subject")} *</Text>
          <TextInput
            value={subject}
            onChangeText={(v) => setSubject(v.slice(0, SUBJECT_MAX))}
            placeholder={t("Escribe un asunto breve", "Write a short subject")}
            placeholderTextColor={palette.placeholder}
            style={[styles.input, { backgroundColor: palette.input, color: palette.text }]}
            returnKeyType="next"
            onSubmitEditing={() => messageRef.current?.focus()}
          />
          <Text style={[styles.hint, { color: palette.subtext }]}>{subject.length}/{SUBJECT_MAX}</Text>

          <Text style={[styles.label, { color: palette.subtext, marginTop: 12 }]}>{t("Mensaje", "Message")} *</Text>
          <TextInput
            ref={messageRef}
            value={message}
            onChangeText={(v) => setMessage(v.slice(0, MESSAGE_MAX))}
            placeholder={t("Cuéntanos en detalle cómo te podemos ayudar…", "Tell us how we can help…")}
            placeholderTextColor={palette.placeholder}
            style={[styles.textarea, { backgroundColor: palette.input, color: palette.text }]}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.hint, { color: palette.subtext }]}>{message.length}/{MESSAGE_MAX}</Text>

          {/* Adjuntos */}
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.label, { color: palette.subtext }]}>{t("Adjuntar imágenes (opcional)", "Attach images (optional)")}</Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <TouchableOpacity
                onPress={pickImages}
                disabled={attachments.length >= ATTACH_MAX}
                style={[
                  styles.attachBtn,
                  { backgroundColor: isDarkMode ? "#262626" : "#F3F4F6", opacity: attachments.length >= ATTACH_MAX ? 0.6 : 1 },
                ]}
              >
                <Ionicons name="image-outline" size={18} color={palette.accent} />
                <Text style={{ color: palette.accent, fontWeight: "800", fontSize: 12 }}>
                  {t("Galería", "Gallery")}
                </Text>
              </TouchableOpacity>

              <Text style={{ color: palette.subtext, fontSize: 12 }}>
                {t("Máx.", "Max.")} {ATTACH_MAX} {t("imágenes", "images")}
              </Text>
            </View>

            {attachments.length > 0 && (
              <View style={styles.attachGrid}>
                {attachments.map((a, idx) => (
                  <View key={`${a.uri}-${idx}`} style={styles.thumbWrap}>
                    <Image source={{ uri: a.uri }} style={styles.thumb} />
                    <TouchableOpacity onPress={() => removeAttachment(idx)} style={[styles.removeThumb, { backgroundColor: palette.accent }]}>
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Enviar */}
          <TouchableOpacity
            onPress={submit}
            disabled={!canSend}
            style={[styles.sendButton, { backgroundColor: palette.accent, opacity: canSend ? 1 : 0.6 }]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.buttonText}>{t("Enviar", "Send")}</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={{ color: palette.subtext, fontSize: 11, marginTop: 8 }}>
            {t("Los campos marcados con * son obligatorios.", "Fields marked with * are required.")}
          </Text>
        </View>
      </ScrollView>

      <BottomNav />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backInline: { flexDirection: "row", alignItems: "center" },

  card: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
  },

  bodyText: { fontSize: 16, lineHeight: 22 },
  label: { fontSize: 12, fontWeight: "700" },
  hint: { fontSize: 11, marginTop: 4, alignSelf: "flex-end" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: "100%",
  },
  textarea: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: "100%",
    minHeight: 120,
  },

  attachBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  attachGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  thumbWrap: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  thumb: { width: "100%", height: "100%" },
  removeThumb: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  sendButton: {
    marginTop: 14,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
});
