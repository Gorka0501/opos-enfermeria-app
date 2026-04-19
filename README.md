# Opos Enfermeria App

Aplicacion movil de test para oposiciones de enfermeria, construida con Expo + React Native.

## Inicio rapido

```bash
npm install
npm start
```

## Comandos utiles

```bash
npm test
npm run build:questions:temario
npm run build:questions
npm run build:apk
npm run build:aab
```

## Documentacion

La documentacion completa esta separada por temas en el directorio `docs`:

- [Indice de documentacion](docs/README.md)
- [Arquitectura](docs/architecture.md)
- [Datos y Persistencia](docs/data-and-storage.md)
- [Sistema de Correcciones](docs/corrections-system.md)
- [Build, Deploy y Operacion](docs/build-and-operations.md)

## Notas de seguridad

- No subir secretos al repositorio (`.env` no se versiona).
- Mantener `.env.example` sin valores reales.
- Si un token se filtra, revocarlo y generar uno nuevo.
