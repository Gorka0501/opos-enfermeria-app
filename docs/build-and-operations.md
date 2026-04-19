# Build, Deploy y Operacion

## Comandos principales

```bash
npm install
npm test
npm start
```

## Generacion de preguntas

Convertir PDFs del temario a JSON (requiere entorno Python con dependencias instaladas):

```bash
npm run build:questions:temario   # PDF -> TXT via OCR (Python)
npm run build:questions           # TXT -> questions.json (Node)
```

Los archivos generados van a la carpeta correspondiente en `data/`, por ejemplo `data/Enfermeria/questions.json`.

## Build Android

```bash
npm run build:apk   # APK para distribucion directa
npm run build:aab   # AAB para Google Play
```

## Actualizacion remota de preguntas

- La app comprueba GitHub una vez cada 24 h por perfil al abrirla.
- El boton "Actualizar preguntas" en HomeScreen fuerza una comprobacion manual.
- Las preguntas se descargan de `raw.githubusercontent.com` sin autenticacion.
- Se cachean individualmente por carpeta (`cachedQuestionsV2_{folder}`).

## Checklist antes de push

1. Verificar que `.env` no este trackeado (`git status`).
2. Verificar que `.env.example` no contiene el token real.
3. Ejecutar pruebas (`npm test`).
4. Revisar `git diff` para detectar cambios no intencionados.

## Troubleshooting rapido

### Error: Token no configurado

- Confirmar `.env` con `EXPO_PUBLIC_GITHUB_WRITE_TOKEN=<token>`.
- Reiniciar Metro con cache limpia: `npx expo start -c`.
- Si es APK instalada, generar nuevo build con el token correcto.

### Push bloqueado por secretos (GH013)

- Eliminar secretos del commit y del historial pendiente.
- Rotar token comprometido en GitHub Settings → Developer settings.
- Reintentar push con commit limpio.

### Preguntas no se actualizan

- Comprobar conectividad.
- Forzar actualizacion desde el boton en HomeScreen.
- Limpiar cache de Metro: `npx expo start -c`.
