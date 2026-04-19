# Sistema de Correcciones

## Objetivo

Permitir:

1. Correccion local inmediata por usuario.
2. Envio de sugerencias para revision del desarrollador.
3. Agregacion de consenso por pregunta.

## Correccion local en app

- La pantalla de correcciones permite cambiar la opcion correcta por pregunta.
- El cambio se guarda localmente en `correctAnswerOverrides`.
- El cambio no modifica los archivos de preguntas directamente.

## Envio de sugerencias a GitHub

Implementado en `src/utils/githubCorrections.ts`.

### Configuracion

Archivo local `.env`:

```dotenv
EXPO_PUBLIC_GITHUB_WRITE_TOKEN=TU_TOKEN
```

Notas:

- `.env` no se versiona (esta en `.gitignore`).
- `.env.example` debe estar vacio (solo la clave sin valor).
- `EXPO_PUBLIC_` se inyecta en build/runtime de Expo.

### Enrutado de correcciones por carpeta

Cada correccion se envia al archivo de su carpeta segun el prefijo del ID de pregunta:

| Prefijo de ID | Archivo destino |
|---|---|
| `A_B_C1_*` | `data/A_B_C1/user-corrections.json` |
| `C2_C3_D_E_*` | `data/C2_C3_D_E/user-corrections.json` |
| `Celador_*` | `data/Celador/user-corrections.json` |
| `Enfermeria_*` | `data/Enfermeria/user-corrections.json` |
| `Tecnico_Superior_*` | `data/Tecnico_Superior/user-corrections.json` |

Si un envio incluye correcciones de varias carpetas, se hacen peticiones GET+PUT separadas por cada carpeta.

### Estructura del archivo remoto

```json
{
  "version": 2,
  "byQuestion": {
    "Enfermeria_42": {
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
