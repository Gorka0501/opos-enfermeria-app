# Arquitectura

## Stack

- Expo SDK 55
- React Native 0.83
- React Navigation (Native Stack)
- AsyncStorage
- TypeScript

## Estructura principal

- `App.tsx`
  - Orquesta estado global, persistencia y navegacion.
  - Gestiona seleccion de perfil, actualizacion remota de preguntas y envio de correcciones por correo.
- `src/components/screens/`
  - Pantallas de UI y flujos de usuario.
- `src/constants/profiles.ts`
  - Define los tres perfiles de oposicion: `enfermeria`, `tecnico_superior`, `celador`.
- `src/utils/`
  - Logica de dominio desacoplada de UI.
- `src/data/questions.ts`
  - Carga el banco de preguntas: datos estaticos empaquetados + cache remota por carpeta.
- `data/`
  - Archivos de preguntas y correcciones por carpeta de perfil.

## Perfiles de oposicion

| Perfil | Carpetas de preguntas |
|---|---|
| `enfermeria` | `A_B_C1` + `Enfermeria` |
| `tecnico_superior` | `A_B_C1` + `Tecnico_Superior` |
| `celador` | `C2_C3_D_E` + `Celador` |

## Flujo de alto nivel

1. App hidrata estado local (stats, falladas, favoritas, ajustes, overrides).
2. Usuario selecciona perfil → se carga banco desde cache o datos estaticos empaquetados.
3. En background se comprueba si han pasado 24 h → actualiza preguntas desde GitHub.
4. Pantallas consumen el estado y emiten acciones.
5. Utils actualizan reglas de negocio y almacenamiento.

## Modulos clave

- `src/utils/quiz.ts`
  - Calculo de score, precision, actualizacion de falladas, y overrides de respuesta correcta.
- `src/utils/storage.ts`
  - API central de lectura/escritura en AsyncStorage.
- `src/utils/remoteQuestions.ts`
  - Descarga preguntas desde `raw.githubusercontent.com` por carpeta y guarda en cache.
- `src/utils/correctionsEmail.ts`
  - Construye un JSON de correcciones y abre la app de correo con asunto/cuerpo preparados.
- `src/utils/openPdf.ts`
  - Abre PDFs del temario empaquetado via `expo-sharing` (movil) o `Linking` (web).
