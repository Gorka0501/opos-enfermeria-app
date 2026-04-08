# Opos Enfermeria App

Aplicacion movil de test para oposiciones de enfermeria, construida con Expo + React Native.

Este documento sirve como guia de mantenimiento para entender rapido:

- como se organiza el codigo,
- que guarda la app en almacenamiento local,
- como funciona cada modo (examen, practica, errores, dificiles),
- y como generar APK.

## Stack

- Expo SDK 51
- React Native 0.74
- React Navigation (stack nativo)
- MMKV para persistencia local
- TypeScript

## Funcionalidades principales

- Examen configurable por numero de preguntas.
- Revision pregunta a pregunta al terminar el examen.
- Practica aleatoria.
- Practica de errores (solo IDs falladas guardadas).
- Practica dificil (umbral configurable por precision/apariciones).
- Favoritas.
- Banco de preguntas con filtros avanzados.
- Estadisticas globales, de practica y de historial de examenes.

## Arquitectura del proyecto

### 1) Orquestacion

- `App.tsx`
	- Estado global de sesion y persistencia cargada.
	- Reglas de negocio para examen/practica.
	- Navegacion entre pantallas.

### 2) UI por pantallas

- `src/components/screens/HomeScreen.tsx`
- `src/components/screens/ExamScreen.tsx`
- `src/components/screens/ExamResultScreen.tsx`
- `src/components/screens/PracticeScreen.tsx`
- `src/components/screens/QuestionListScreen.tsx`
- `src/components/screens/StatsScreen.tsx`
- `src/components/screens/OptionsScreen.tsx`

### 3) Dominio y utilidades

- `src/utils/quiz.ts`: calculos de score, merge de falladas, estadisticas derivadas.
- `src/utils/sessionHistory.ts`: construccion del registro de sesion de examen.
- `src/utils/shuffle.ts`: seleccion aleatoria/semi-aleatoria.
- `src/utils/storage.ts`: acceso a MMKV.

### 4) Datos

- `data/questions.json`: banco final consumido por la app.
- `scripts/pdf-temario-to-questions.py`: genera preguntas desde PDFs.
- `scripts/txt-to-questions-json.js`: alternativa desde TXT.

## Flujo funcional resumido

### Examen

1. Se seleccionan preguntas habilitadas.
2. Cada respuesta suma estadistica por pregunta (`questionStats`).
3. Al finalizar:
	 - se recalculan `failedIds` (ignorando no respondidas),
	 - se actualizan stats globales,
	 - se guarda una sesion en `sessionHistory`.
4. Se abre `ExamResultScreen` para resumen y revision.

### Practica

- Aleatoria: todo el banco habilitado.
- Errores: solo `failedIds`.
- Dificil: preguntas con precision personal por debajo del umbral configurado.

## Persistencia (MMKV)

Claves principales definidas en `src/utils/storage.ts`:

- `failedQuestionIds`: IDs falladas persistentes.
- `favoriteQuestionIds`: IDs favoritas.
- `disabledQuestionIds`: IDs excluidas del pool.
- `questionStats`: contador por pregunta (`timesShown`, `timesCorrect`, `timesFailed`).
- `appStats`: acumulados globales + `sessionHistory`.
- `fontScale`: escala tipografica global.

## Reglas importantes de negocio

- Preguntas no respondidas en examen:
	- visualmente aparecen como no acertadas en revision,
	- pero no se agregan a `failedQuestionIds`.
- `sessionHistory` guarda maximo 50 sesiones.
- En `StatsScreen` se muestran los 10 examenes mas recientes en historial desplegable.

## Comandos utiles

```bash
npm install
npm test
npm start
```

Generacion de banco:

```bash
npm run build:questions:temario
npm run build:questions
```

Build Android:

```bash
npm run build:apk
npm run build:aab
```

## Tests

- `tests/quiz.test.ts`
- `tests/sessionHistory.test.ts`
- `tests/shuffle.test.ts`

Ejecutar:

```bash
npm test
```

## Notas de mantenimiento

- Si cambias reglas de examen/practica, revisa tambien `quiz.ts` y tests.
- Si tocas persistencia, mantén compatibilidad de claves MMKV para no perder datos de usuarios.
- Si cambias dependencias de React Native, valida `npm run build:apk` porque EAS puede fallar por incompatibilidades nativas.
