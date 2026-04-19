# Build, Deploy y Operacion

## Comandos principales

```bash
npm install
npm test
npm start
```

## Generacion de preguntas

```bash
npm run build:questions:temario
npm run build:questions
```

## Build Android

```bash
npm run build:apk
npm run build:aab
```

## Checklist antes de push

1. Verificar que `.env` no este trackeado.
2. Verificar que `.env.example` no contiene secretos.
3. Ejecutar pruebas (`npm test`).
4. Revisar `git status` y `git diff`.

## Troubleshooting rapido

### Error: Token no configurado

- Confirmar `.env` con `EXPO_PUBLIC_GITHUB_WRITE_TOKEN`.
- Reiniciar Metro con cache limpia: `npx expo start -c`.
- Si es APK instalada, generar nuevo build.

### Push bloqueado por secretos (GH013)

- Eliminar secretos del commit y del historial pendiente.
- Rotar token comprometido en GitHub.
- Reintentar push con commit limpio.
