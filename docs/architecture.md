# Arquitectura

## Stack

- Expo SDK 51
- React Native 0.74
- React Navigation (Native Stack)
- AsyncStorage
- TypeScript

## Estructura principal

- `App.tsx`
  - Orquesta estado global, persistencia y navegacion.
  - Aplica reglas de negocio de examen y practica.
- `src/components/screens/`
  - Pantallas de UI y flujos de usuario.
- `src/utils/`
  - Logica de dominio desacoplada de UI.
- `src/data/questions.ts`
  - Entrada del banco de preguntas cargado desde JSON.
- `data/`
  - Archivos de preguntas y correcciones sugeridas.

## Flujo de alto nivel

1. App hidrata estado local (stats, falladas, favoritas, ajustes, overrides).
2. App construye el pool de preguntas activo.
3. Pantallas consumen el estado y emiten acciones.
4. Utils actualizan reglas de negocio y almacenamiento.

## Modulos clave

- `src/utils/quiz.ts`
  - Calculo de score, precision, actualizacion de falladas, y overrides de respuesta correcta.
- `src/utils/storage.ts`
  - API central de lectura/escritura en AsyncStorage.
- `src/utils/githubCorrections.ts`
  - Envio de sugerencias a `data/user-corrections.json` en GitHub.
