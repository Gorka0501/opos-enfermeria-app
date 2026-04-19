# Datos y Persistencia

## Fuentes de datos

- `data/questions.json`: banco base de preguntas.
- `data/user-corrections.json`: sugerencias remotas agregadas por pregunta.

## Claves de AsyncStorage

Definidas en `src/utils/storage.ts`.

- `failedQuestionIds`
- `favoriteQuestionIds`
- `disabledQuestionIds`
- `questionStats`
- `appStats`
- `fontScale`
- `correctAnswerOverrides`
- `cachedRemoteQuestions`

## Reglas importantes

- Preguntas no respondidas en examen no se agregan a falladas.
- Historial de sesiones se limita a 50 registros.
- Overrides locales (`correctAnswerOverrides`) se aplican sobre el pool activo.

## Cache de preguntas remotas

Si existe banco remoto descargado, se usa cache local para mejorar disponibilidad offline.
