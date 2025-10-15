// app/(rutas)/contacto-coach/index.tsx  (o reemplaza tu screen actual)
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

type Attachment = {
  uri: string;
  name?: string;
  type?: string; // mime-type si lo tienes
};

export default function ContactCoachScreen() {
  const navigation = useNavigation();
  const { isDarkMode, language } = useAppContext();
  const t = (es: string, en: string) => (language === "es" ? es : en);

  // Paleta (igual estilo que tu chat)
  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        header: "#1E1E1E",
        headerText: "#FFFFFF",
        text: "#FFFFFF",
        subtext: "#AAAAAA",
        accent: "#EF233C",
        inputBg: "#22262E",
        inputText: "#FFFFFF",
        placeholder: "#AAAAAA",
        barBorder: "#2A2A2A",
        cardBg: "#1B1B1B",
        chipBg: "#222",
      }
    : {
        background: "#F9F9F9",
        header: "#FFFFFF",
        headerText: "#111111",
        text: "#111111",
        subtext: "#555555",
        accent: "#EF233C",
        inputBg: "#FFFFFF",
        inputText: "#111111",
        placeholder: "#888888",
        barBorder: "#E5E7EB",
        cardBg: "#FFFFFF",
        chipBg: "#F3F4F6",
      };

  // Formularios
  const [yourEmail, setYourEmail] = useState(""); // si ya lo tienes en contexto, puedes prellenar
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);

  const messageRef = useRef<TextInput>(null);
  const SUBJECT_MAX = 120;
  const MESSAGE_MAX = 2000;
  const ATTACH_MAX = 4;

  // === Stub de integración back ===
  async function sendContactEmail(payload: {
    from?: string;
    subject: string;
    message: string;
    attachments: Attachment[];
    locale: string; // "es-CL" | "en-US" etc.
    sentAtISO: string;
  }) {
    // ⬇️ Back lo reemplaza por su fetch/axios/etc
    // Ejemplo esperado:
    // await fetch("https://api.tu-back.com/contact", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    return new Promise((resolve) => setTimeout(resolve, 800)); // simulación
  }

  // === Validación simple ===
  const canSend =
    subject.trim().length >= 3 &&
    message.trim().length >= 10 &&
    subject.trim().length <= SUBJECT_MAX &&
    message.trim().length <= MESSAGE_MAX &&
    !sending;

  // === Adjuntar imágenes ===
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
      const payload = {
        from: yourEmail.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        attachments,
        locale: language === "es" ? "es-CL" : "en-US",
        sentAtISO: new Date().toISOString(),
      };
      await sendContactEmail(payload);
      Alert.alert(
        t("Enviado", "Sent"),
        t("Tu mensaje fue enviado. Te contactaremos al correo indicado.", "Your message was sent. We'll reply to your email.")
      );
      // reset
      setSubject("");
      setMessage("");
      setAttachments([]);
      // opcional: navigation.goBack()
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
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.header, borderBottomColor: palette.barBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={palette.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.headerText }]}>
          {t("Contactar por correo", "Contact via email")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Nota */}
        <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.barBorder }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="mail-outline" size={18} color={palette.accent} />
            <Text style={{ color: palette.subtext, fontSize: 12, lineHeight: 18, flex: 1 }}>
              {t(
                "Completa el formulario para contactar al coach por correo. El equipo responderá a la brevedad.",
                "Fill out the form to contact the coach via email. We'll get back to you shortly."
              )}
            </Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.barBorder }]}>
          {/* Tu correo (opcional si backend ya lo conoce) */}
          <Text style={[styles.label, { color: palette.subtext }]}>{t("Tu correo (opcional)", "Your email (optional)")}</Text>
          <TextInput
            value={yourEmail}
            onChangeText={setYourEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t("ej. nombre@correo.com", "e.g. name@email.com")}
            placeholderTextColor={palette.placeholder}
            style={[styles.input, { backgroundColor: palette.inputBg, color: palette.inputText, borderColor: palette.barBorder }]}
            returnKeyType="next"
            onSubmitEditing={() => messageRef.current?.focus()}
          />

          {/* Asunto */}
          <Text style={[styles.label, { color: palette.subtext, marginTop: 12 }]}>{t("Asunto", "Subject")} *</Text>
          <TextInput
            value={subject}
            onChangeText={(v) => setSubject(v.slice(0, SUBJECT_MAX))}
            placeholder={t("Escribe un asunto breve", "Write a short subject")}
            placeholderTextColor={palette.placeholder}
            style={[styles.input, { backgroundColor: palette.inputBg, color: palette.inputText, borderColor: palette.barBorder }]}
            returnKeyType="next"
            onSubmitEditing={() => messageRef.current?.focus()}
          />
          <Text style={[styles.hint, { color: palette.subtext }]}>
            {subject.length}/{SUBJECT_MAX}
          </Text>

          {/* Mensaje */}
          <Text style={[styles.label, { color: palette.subtext, marginTop: 12 }]}>{t("Mensaje", "Message")} *</Text>
          <TextInput
            ref={messageRef}
            value={message}
            onChangeText={(v) => setMessage(v.slice(0, MESSAGE_MAX))}
            placeholder={t("Cuéntanos en detalle cómo te podemos ayudar…", "Tell us how we can help…")}
            placeholderTextColor={palette.placeholder}
            style={[
              styles.textarea,
              { backgroundColor: palette.inputBg, color: palette.inputText, borderColor: palette.barBorder },
            ]}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.hint, { color: palette.subtext }]}>
            {message.length}/{MESSAGE_MAX}
          </Text>

          {/* Adjuntos */}
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.label, { color: palette.subtext }]}>
              {t("Adjuntar imágenes (opcional)", "Attach images (optional)")}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <TouchableOpacity
                onPress={pickImages}
                disabled={attachments.length >= ATTACH_MAX}
                style={[
                  styles.attachBtn,
                  {
                    backgroundColor: palette.chipBg,
                    borderColor: palette.barBorder,
                    opacity: attachments.length >= ATTACH_MAX ? 0.6 : 1,
                  },
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

            {/* Grid de adjuntos */}
            {attachments.length > 0 && (
              <View style={styles.attachGrid}>
                {attachments.map((a, idx) => (
                  <View key={`${a.uri}-${idx}`} style={[styles.thumbWrap, { borderColor: palette.barBorder }]}>
                    <Image source={{ uri: a.uri }} style={styles.thumb} />
                    <TouchableOpacity
                      onPress={() => removeAttachment(idx)}
                      style={[styles.removeThumb, { backgroundColor: palette.accent }]}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Botón Enviar */}
          <TouchableOpacity
            onPress={submit}
            disabled={!canSend}
            style={[
              styles.sendButton,
              { backgroundColor: palette.accent, opacity: canSend ? 1 : 0.6 },
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "800", marginLeft: 8 }}>
                  {t("Enviar", "Send")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Leyenda pequeña */}
          <Text style={{ color: palette.subtext, fontSize: 11, marginTop: 8 }}>
            {t("Los campos marcados con * son obligatorios.", "Fields marked with * are required.")}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 16 },

  card: {
    marginTop: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },

  label: { fontSize: 12, fontWeight: "700" },
  hint: { fontSize: 11, marginTop: 4, alignSelf: "flex-end" },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 6,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    fontSize: 14,
    marginTop: 6,
  },

  attachBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
});
