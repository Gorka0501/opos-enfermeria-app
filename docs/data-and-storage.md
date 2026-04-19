# Datos y Persistencia

## Estructura de datos en repo

El banco de preguntas esta dividido por carpeta de perfil:

```
data/
  A_B_C1/
    questions.json
    user-corrections.json
  C2_C3_D_E/
    questions.json
    user-corrections.json
  Celador/
    questions.json
    user-corrections.json
  Enfermeria/
    questions.json
    user-corrections.json
  Tecnico_Superior/
    questions.json
    user-corrections.json
```

No existe `data/questions.json` ni `data/user-corrections.json` en la raiz.

## Claves de AsyncStorage

Definidas en `src/utils/storage.ts`.

| Clave | Contenido |
|---|---|
| `failedQuestionIds` | IDs de preguntas falladas |
| `favoriteQuestionIds` | IDs de preguntas favoritas |
| `disabledQuestionIds` | IDs de preguntas excluidas del banco |
| `questionStats` | Estadisticas por pregunta (veces vista, acertada, fallada) |
| `appStats` | Estadisticas globales y historial de sesiones |
| `fontScale` | Escala de fuente global |
| `correctAnswerOverrides` | Overrides locales de respuesta correcta |
| `userProfile` | Perfil seleccionado por el usuario |
| `cachedQuestionsV2_{folder}` | Cache de preguntas remotas por carpeta |
| `lastQuestionsCheckMs_{profileId}` | Timestamp de ultima comprobacion remota por perfil |

## Reglas importantes

- Preguntas no respondidas en examen no se agregan a falladas.
- Historial de sesiones se limita a 50 registros.
- Overrides locales (`correctAnswerOverrides`) se aplican sobre el pool activo.

## Cache de preguntas remotas

- `src/utils/remoteQuestions.ts` descarga cada carpeta del perfil desde `raw.githubusercontent.com`.
- Cada carpeta se cachea individualmente con clave `cachedQuestionsV2_{folder}`.
- La comprobacion automatica se hace una vez cada 24 horas por perfil.
- En ausencia de cache, se usan los datos estaticos empaquetados en el APK como fallback.
