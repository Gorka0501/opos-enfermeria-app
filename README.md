# App movil de test para oposiciones de enfermeria

Aplicacion hecha con Expo + React Native para practicar preguntas tipo examen de
oposiciones de enfermeria.

## Funcionalidades

- Examen aleatorio de hasta 30 preguntas.
- Modo repaso de errores (solo preguntas falladas antes).
- Registro persistente de errores en el movil.
- Banco de preguntas en JSON generado desde tu carpeta temario.

## Estructura clave

- App.tsx: logica principal de examen y pantallas.
- data/questions.json: banco de preguntas.
- scripts/pdf-temario-to-questions.py: extractor de preguntas desde PDFs del temario.
- scripts/txt-to-questions-json.js: alternativa para importar desde texto limpio.

## Fuente de datos del temario

Por defecto, el script Python toma todos los PDFs de la carpeta hermana:

- ../temario/*.pdf

Con tu estructura actual, detecta automaticamente:

- 200 ENFERMERO G.pdf
- 200-Galdera-sorta_TEMARIO-COMUN_cas.pdf
- 500 ENFERMERO C.pdf
- ENFERMERIA_500_preguntas_cas.pdf

Y genera el banco final en:

- data/questions.json

Comando:

```bash
pip install pypdf
python scripts/pdf-temario-to-questions.py
```

## Formato alternativo para importar desde TXT

Crea data/questions_raw.txt con bloques separados por una linea en blanco.

Ejemplo:

```txt
1. Cual es la principal medida para prevenir infecciones nosocomiales?
a) Evitar guantes
b) Higiene de manos
c) Reducir ventilacion
d) No registrar incidencias
Respuesta: b
Explicacion: La higiene de manos es la medida mas eficaz para prevenir infecciones.

2. En RCP basica de adulto, la relacion compresiones-ventilaciones es:
a) 10:1
b) 15:2
c) 30:2
d) 5:1
Respuesta: c
```

## Comandos

```bash
npm install
npm test
npm run build:questions:temario
npm run build:questions
npm start
```

## Tests

Hay tests unitarios para la logica de quiz en:

- tests/quiz.test.ts

Cubren:

- calculo de puntuacion
- limite minimo y maximo de preguntas por examen
- actualizacion de preguntas falladas
- actualizacion de estadisticas
- calculo de porcentajes de acierto

Ejecucion:

```bash
npm test
```

## Ejecutar en movil

1. Instala la app Expo Go en tu telefono.
2. Ejecuta npm start en el proyecto.
3. Escanea el QR mostrado por Expo.

## Notas

- data/questions.json incluye 5 preguntas de ejemplo de enfermeria para arrancar.
- El flujo recomendado es build:questions:temario para cargar preguntas desde los PDFs.
- Si algun PDF tiene formato distinto, usa la via TXT para normalizar y despues build:questions.
