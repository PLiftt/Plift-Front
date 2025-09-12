import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Image, ImageBackground } from 'react-native';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

type LoginScreenProps = {
  onSwitchToRegister: () => void;
};

export default function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

 const handleLogin = async () => {
  // Validación de campos vacíos
  if (!email || !password) {
    alert("Por favor completa todos los campos");
    return;
  }

  setIsLoading(true);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // simulando llamada a API
  setIsLoading(false);

  // Ejemplo de usuario registrado (puedes reemplazarlo con tu API)
  const usuariosRegistrados = [
    { email: "test@example.com", password: "123456" },
    { email: "demo@example.com", password: "abcdef" },
  ];

  const usuarioValido = usuariosRegistrados.find(
    (u) => u.email === email && u.password === password
  );

  if (usuarioValido) {
    // Aquí navegarías a la siguiente pantalla usando tu router
    // router.push("/home"); // descomenta si usas expo-router
    alert(`¡Bienvenido, ${email}!`);
  } else {
    alert("Usuario no registrado o contraseña incorrecta");
  }
};
  
  return (
    <SafeAreaView style={styles.container}>

      <ImageBackground
        source={require("../../assets/fondobg.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover" // ajusta la imagen sin deformarla
      ></ImageBackground>


      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          {/* Logo */}
          <Image
            source={require('../../assets/logoplift.png')}
            style={styles.logo}
            resizeMode="contain"
          />
            <Text style={styles.title}>Bienvenido a PLift</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Únete a Nosotros</Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Ingresa tu email"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, {}]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            disabled={isLoading}
            onPress={handleLogin}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotButton}
          onPress={() => {
            if (!email) {
            alert("Por favor ingresa tu email para recuperar la contraseña");
              } else {
              // Aquí podrías llamar a tu API real de recuperación
            alert(`Se ha enviado un enlace de recuperación a ${email}`);
            }
          }}
          >
          <Text style={styles.forgotText}>Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Switch to register */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>No tienes una cuenta?</Text>
            <TouchableOpacity onPress={onSwitchToRegister}>
              <Text style={styles.switchButton}>Crea tu cuenta aquÍ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111', // fondo negro
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1F1F1F', // card oscuro
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E5E7EB',
    textAlign: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },

  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  inputWrapper: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    marginTop: 4,
    left: 12,
    top: 12,
  },
  input: {
    height: 48,
    backgroundColor: '#1F1F1F',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  eyeButton: {
    position: 'absolute',
    marginTop: 4,
    right: 12,
    top: 12,
  },
  button: {
    height: 48,
    backgroundColor: '#EF233C', // rojo
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 4,
  },
  switchButton: {
    fontSize: 14,
    color: '#EF233C',
    fontWeight: '600',
  },
});
