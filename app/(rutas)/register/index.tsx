import React, { useState } from "react";
import { Link } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Platform,
  Alert,
  Modal,
} from "react-native";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  UserCheck,
  Calendar,
  Users,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { registerUser } from "services/authService";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("");

  const [names, setNames] = useState("");
  const [lastNames, setLastNames] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const namesArray = names.trim().split(" ");
  const lastNamesArray = lastNames.trim().split(" ");

  const handleRegister = async () => {
    try {
      setIsLoading(true);

      const payload = {
        email,
        password,
        password2,
        first_name: namesArray[0] || "",
        second_name: namesArray[1] || null,
        last_name: lastNamesArray[0] || "",
        second_last_name: lastNamesArray[1] || null,
        gender,
        date_of_birth: dob.toISOString().split("T")[0], // YYYY-MM-DD
        role: selectedRole, // "COACH" o "ATHLETE"
      };

      const user = await registerUser(payload);
      Alert.alert("Registro exitoso", `Bienvenido ${user.email}`);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", JSON.stringify(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../assets/fondobg.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.card}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Inicia hoy y únete a nosotros!</Text>

        <View style={styles.form}>
          {/* Nombres */}
          <View style={styles.inputWrapper}>
            <User size={18} color="#888" style={styles.icon} />
            <TextInput
              placeholder="Nombres"
              value={names}
              onChangeText={setNames}
              style={styles.input}
              placeholderTextColor="#888"
            />
          </View>

          {/* Apellidos */}
          <View style={styles.inputWrapper}>
            <User size={18} color="#888" style={styles.icon} />
            <TextInput
              placeholder="Apellidos"
              value={lastNames}
              onChangeText={setLastNames}
              style={styles.input}
              placeholderTextColor="#888"
            />
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Mail size={18} color="#888" style={styles.icon} />
            <TextInput
              placeholder="Ingresa tu email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Lock size={18} color="#888" style={styles.icon} />
            <TextInput
              placeholder="Crea tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              style={styles.iconRight}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={18} color="#888" />
              ) : (
                <Eye size={18} color="#888" />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <Lock size={18} color="#888" style={styles.icon} />
            <TextInput
              placeholder="Confirma tu contraseña"
              value={password2}
              onChangeText={setPassword2}
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              placeholderTextColor="#888"
            />
            <TouchableOpacity
              style={styles.iconRight}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={18} color="#888" />
              ) : (
                <Eye size={18} color="#888" />
              )}
            </TouchableOpacity>
          </View>

          {/* Rol */}
          <Text style={styles.label}>Rol</Text>
          <View style={styles.roleWrapper}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === "coach" && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole("coach")}
            >
              <UserCheck
                size={18}
                color={selectedRole === "coach" ? "#fff" : "#888"}
              />
              <Text
                style={[
                  styles.roleText,
                  selectedRole === "coach" && styles.roleTextActive,
                ]}
              >
                Coach
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                selectedRole === "athlete" && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole("athlete")}
            >
              <User
                size={18}
                color={selectedRole === "athlete" ? "#fff" : "#888"}
              />
              <Text
                style={[
                  styles.roleText,
                  selectedRole === "athlete" && styles.roleTextActive,
                ]}
              >
                Atleta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fecha de nacimiento */}
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={18} color="#888" style={styles.icon} />
            <Text style={[styles.input, { paddingVertical: 12 }]}>
              {dob.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker &&
            (Platform.OS === "ios" ? (
              <Modal transparent animationType="slide" visible={showDatePicker}>
                <View
                  style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    backgroundColor: "rgba(0,0,0,0.3)",
                  }}
                >
                  <View style={styles.dateStyle}>
                    <DateTimePicker
                      value={dob}
                      mode="date"
                      display="spinner"
                      onChange={(_, selectedDate) => {
                        if (selectedDate) setDob(selectedDate);
                      }}
                      maximumDate={new Date()}
                    />
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={{ padding: 10, alignItems: "center" }}
                    >
                      <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                        Confirmar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={dob}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDob(selectedDate);
                }}
                maximumDate={new Date()}
              />
            ))}

          {/* Género */}
          <View style={[styles.inputWrapper, { paddingHorizontal: 0 }]}>
            <Users
              size={18}
              color="#888"
              style={{ ...styles.icon, marginLeft: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Picker
                selectedValue={gender}
                onValueChange={(val) => setGender(val)}
                style={{ height: "auto" }}
              >
                <Picker.Item label="Selecciona género" value="" />
                <Picker.Item label="Masculino" value="male" />
                <Picker.Item label="Femenino" value="female" />
                <Picker.Item label="Otro" value="other" />
              </Picker>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>

        <View style={styles.switchWrapper}>
          <Text style={styles.switchText}>¿Ya tienes una cuenta?</Text>
          <Link href="/login" asChild>
            <Text style={styles.switchLink}> Inicia sesión aquí</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    color: "#E5E7EB",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#f0344a",
    marginBottom: 20,
    fontWeight: "600",
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
    color: "#fff",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 48,
    backgroundColor: "#fafafa",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  icon: {
    marginRight: 8,
  },
  iconRight: {
    padding: 6,
  },
  roleWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff",
    marginHorizontal: 4,
    justifyContent: "center",
  },
  roleButtonActive: {
    backgroundColor: "#EF233C",
    borderColor: "#EF233C",
  },
  roleText: {
    marginLeft: 6,
    color: "#fff",
    fontSize: 14,
  },
  roleTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#EF233C",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  switchWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  switchText: {
    fontSize: 15,
    color: "#fff",
  },
  switchLink: {
    fontSize: 15,
    color: "#f0344a",
    fontWeight: "600",
  },
  dateStyle: {
    backgroundColor: "#353535ff",
    padding: 20,
  },
});