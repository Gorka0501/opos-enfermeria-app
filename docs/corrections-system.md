# Sistema de Correcciones

## Objetivo

Permitir:

1. Correccion local inmediata por usuario.
2. Envio de sugerencias para revision del desarrollador.
3. Flujo simple de envio sin secretos en cliente.

## Correccion local en app

- La pantalla de correcciones permite cambiar la opcion correcta por pregunta.
- El cambio se guarda localmente en `correctAnswerOverrides`.
- El cambio no modifica los archivos de preguntas directamente.

## Envio de sugerencias por correo

Implementado en `src/utils/correctionsEmail.ts`.

### Configuracion

Archivo local `.env`:

```dotenv
EXPO_PUBLIC_CORRECTIONS_EMAIL=tu-correo@dominio.com
```

Notas:

- `.env` no se versiona (esta en `.gitignore`).
- Si no se configura email por defecto, el usuario puede completarlo al abrir su app de correo.
- `EXPO_PUBLIC_` se inyecta en build/runtime de Expo.

### Formato de datos enviado

Cada envio incluye un JSON con:

- `generatedAt` (fecha ISO).
- `total` (numero de correcciones).
- `corrections[]` con `questionId`, `originalIndex`, `suggestedIndex` y `source` opcional.

### Proceso operativo recomendado

1. Usuario corrige preguntas en la app.
2. Usuario pulsa "Enviar por correo".
3. Se abre la app de email con asunto y cuerpo ya preparados.
4. El desarrollador recibe el JSON y decide como integrarlo en el banco de preguntas.

## Seguridad

- No se usan tokens de GitHub dentro de la app para enviar correcciones.
- El envio depende de la app de correo instalada en el dispositivo.
