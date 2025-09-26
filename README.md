#  Plift-Front

**Plift** es una aplicación móvil de fitness desarrollada con React Native y Expo Router, diseñada para ayudar a los usuarios a gestionar sus entrenamientos, hacer seguimiento de estadísticas y mantener una vida saludable.

##  Descripción

Plift-Front es el frontend de la aplicación Plift, una plataforma integral de fitness que incluye:
- Gestión de perfiles de usuario
- Seguimiento de entrenamientos y rutinas
- Chat integrado para comunidad fitness
- Estadísticas detalladas de progreso
- Sistema de autenticación completo
- Interfaz moderna con modo oscuro/claro

##  Estructura del Proyecto

```
Plift-Front/
├──  app/                          # Directorio principal de la aplicación (Expo Router)
│   ├── _layout.tsx                  # Layout raíz de la aplicación
│   ├── global.css                   # Estilos globales con TailwindCSS
│   ├── index.tsx                    # Pantalla de inicio/splash
│   ├──  (rutas)/                  # Grupo de rutas principales
│   │   ├── _layout.tsx              # Layout para las rutas principales
│   │   ├──  chat/                 # Funcionalidad de chat
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx            # Pantalla principal del chat
│   │   ├──  estadisticas/         # Estadísticas y métricas
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx            # Dashboard de estadísticas
│   │   ├──  fit/                  # Rutinas y entrenamientos
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx            # Gestión de entrenamientos
│   │   ├──  home/                 # Pantalla principal
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx            # Dashboard principal
│   │   ├──  login/                # Autenticación
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx            # Pantalla de inicio de sesión
│   │   ├──  perfil/               # Gestión de perfil
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx            # Configuración de usuario
│   │   └──  register/             # Registro de usuarios
│   │       ├── _layout.tsx
│   │       └── index.tsx            # Formulario de registro
│   └──  components/               # Componentes reutilizables
├──  assets/                       # Recursos estáticos
│   ├── adaptive-icon.png            # Icono adaptativo para Android
│   ├── favicon.png                  # Favicon para web
│   ├── fondobg.jpg                  # Imagen de fondo
│   ├── icon.png                     # Icono principal
│   ├── logoplift.png               # Logo de la aplicación
│   └── splash-icon.png              # Icono del splash screen
├──  android/                      # Configuración nativa de Android
│   ├── build.gradle                 # Configuración de build principal
│   ├── settings.gradle              # Configuración de módulos
│   └── app/                         # Módulo principal de Android
│       ├── build.gradle             # Configuración del módulo app
│       └── src/main/                # Código fuente nativo
├──  docs/                         # Documentación del proyecto
│   ├── docs.md                      # Documentación general
│   └── Guia-git.md                  # Guía de uso de Git
├──  Archivos de configuración
│   ├── app.json                     # Configuración de Expo
│   ├── babel.config.js              # Configuración de Babel
│   ├── metro.config.js              # Configuración de Metro bundler
│   ├── package.json                 # Dependencias y scripts
│   ├── tailwind.config.js           # Configuración de TailwindCSS
│   ├── tsconfig.json                # Configuración de TypeScript
│   └── nativewind-env.d.ts          # Tipos para NativeWind
└── README.md                        # Este archivo
```

##  Comandos de Inicialización

Sigue estos pasos para configurar el proyecto después de clonarlo:

### 1. Clonar el repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd Plift-Front
```

### 2. Instalar dependencias
```bash
# Con npm
npm install

# O con yarn
yarn install
```

### 3. Configurar el entorno
```bash
# Configurar prebuild para plataformas nativas
npx expo prebuild --platform all
```

### 4. Iniciar el proyecto

#### Desarrollo general
```bash
# Iniciar el servidor de desarrollo
npm start
# o
npx expo start
```

#### Plataformas específicas
```bash
# Android (requiere Android Studio y emulador configurado)
npm run android

# iOS (solo en macOS con Xcode)
npm run ios

# Web
npm run web
```

##  Tecnologías Utilizadas

- **React Native** `0.79.6` - Framework principal
- **Expo** `~53.0.22` - Plataforma de desarrollo
- **Expo Router** `~5.0.0` - Sistema de navegación basado en archivos
- **TypeScript** `~5.8.3` - Tipado estático
- **NativeWind** `4.0.1` - TailwindCSS para React Native
- **React Native Reanimated** `~3.17.4` - Animaciones fluidas
- **Lucide React** `0.544.0` - Iconos modernos

##  Requisitos del Sistema

- **Node.js** >= 16.0.0
- **npm** o **yarn**
- **Expo CLI** (se instala automáticamente)
- Para Android: **Android Studio** y **Android SDK**
- Para iOS: **Xcode** (solo macOS)

##  Enlaces Útiles

- [Documentación de Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind](https://www.nativewind.dev/)
- [React Native](https://reactnative.dev/)
