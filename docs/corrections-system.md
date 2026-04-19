# Sistema de Correcciones

## Objetivo

Permitir:

1. Correccion local inmediata por usuario.
2. Envio de sugerencias para revision del desarrollador.
3. Agregacion de consenso por pregunta.

## Correccion local en app

- La pantalla de correcciones permite cambiar la opcion correcta por pregunta.
- El cambio se guarda localmente en `correctAnswerOverrides`.
- El cambio no modifica `data/questions.json` directamente.

## Envio de sugerencias a GitHub

Implementado en `src/utils/githubCorrections.ts`.

### Configuracion

Archivo local `.env`:

```dotenv
EXPO_PUBLIC_GITHUB_WRITE_TOKEN=TU_TOKEN
```

Notas:

- `.env` no se versiona.
- `.env.example` debe estar vacio.
- `EXPO_PUBLIC_` se inyecta en build/runtime de Expo.

### Archivo remoto

Se escribe en `data/user-corrections.json` con estructura por pregunta:

```json
{
  "version": 2,
  "byQuestion": {
    "Q123": {
      "originalIndex": 1,
      "suggestions": [
        {
          "date": "2026-04-08T12:00:00.000Z",
          "submitterId": "device-abc123",
          "originalIndex": 1,
          "suggestedIndex": 3
        }
      ]
    }
  }
}
```

## Regla de autocorreccion por consenso

- Umbral: 10 usuarios distintos por pregunta.
- Cada usuario cuenta un voto por pregunta (se conserva el mas reciente).
- Al superar el umbral, se calcula mayoria y se guarda `autoCorrection`.
- En empate, se elige el indice menor para comportamiento determinista.
