# Cómo Generar el APK

Tu proyecto está configurado para compilar APKs usando GitHub Actions **sin costo alguno**.

## Método: GitHub Actions (Recomendado ✅)

### Requiere:
- Un repositorio en GitHub
- Tus credenciales de Expo configuradas como secreto

### Pasos:

#### 1️⃣ Obtener tu token de Expo
```bash
eas whoami
```
(Ya confirmamos que eres: `gorka0501`)

#### 2️⃣ Configurar el secreto en GitHub

1. Ve a tu repositorio en **github.com**
2. **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. **Nombre:** `EXPO_TOKEN`
5. **Valor:** Ejecuta esto en tu terminal:
```bash
npx eas-cli@latest credentials show --platform android
```
O simplemente usa tu Expo token (disponible en https://expo.dev/settings/tokens)

#### 3️⃣ Push del workflow

El archivo `.github/workflows/build-apk.yml` ya está creado. Solo necesitas hacer:

```bash
git add .github/workflows/build-apk.yml
git commit -m "Add GitHub Actions APK build workflow"
git push
```

#### 4️⃣ Descargar el APK

1. Ve a tu repositorio en GitHub
2. Click en **Actions**
3. Selecciona el workflow (debería estar corriendo)
4. Espera a que termine (unos 10-15 minutos)
5. Click en el artifact **apk-build**
6. Descarga el APK

---

## Alternativa: Compilar localmente

**Requisitos:**
- Java JDK 17+ (NO está instalado en tu sistema actualmente)
- Android SDK

Si quieres instalar Java:
1. Descarga [JDK 17+](https://adoptium.net/)
2. Instala Android Studio o solo las herramientas de Android
3. Ejecuta:
```bash
npm run prebuild -- --clean
cd android
./gradlew assembleRelease
```

El APK estará en: `android/app/build/outputs/apk/release/app-release.apk`

---

## Estado actual:
✅ Estás autenticado en Expo (`gorka0501`)
✅ El workflow de GitHub Actions está configurado
⏳ Solo falta: Configurar el secreto `EXPO_TOKEN` en GitHub y hacer push
