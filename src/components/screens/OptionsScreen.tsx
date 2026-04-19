import { Asset } from "expo-asset";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { AppText as Text } from "../AppText";
import { useFontScale } from "../../context/FontScaleContext";
import { openPdfUri } from "../../utils/openPdf";
import { styles, theme } from "../../styles/appStyles";
import { ProfileId } from "../../constants/profiles";

type OptionsScreenProps = {
  onGoHome: () => void;
  onFontScaleChange: (scale: number) => void;
  hardMaxAccuracy: number;
  hardMinShown: number;
  onHardMaxAccuracyChange: (v: number) => void;
  onHardMinShownChange: (v: number) => void;
  currentProfileLabel?: string;
  onChangeProfile?: () => void;
  profileId?: ProfileId;
};

type PdfItem = {
  code: string;
  title: string;
  module: number;
};

const PDFS_COMUN_ABC1: PdfItem[] = [
  {
    code: "1.1",
    title: "Temario Común A/B/C1 – Preguntas",
    module: require("../../../assets/temario/temario_comun_200_preguntas_cas.pdf"),
  },
  {
    code: "1.2",
    title: "Temario Común A/B/C1 – Respuestas",
    module: require("../../../assets/temario/temario_enfermero_200_g.pdf"),
  },
];

const PDFS_ENFERMERIA: PdfItem[] = [
  {
    code: "2.1",
    title: "Temario Enfermería – Preguntas",
    module: require("../../../assets/temario/temario_enfermeria_500_preguntas_cas.pdf"),
  },
  {
    code: "2.2",
    title: "Temario Enfermería – Respuestas",
    module: require("../../../assets/temario/temario_enfermero_500_c.pdf"),
  },
];

const FONT_PRESETS = [0.85, 0.9, 1, 1.15, 1.3, 1.4];

export function OptionsScreen({ onGoHome, onFontScaleChange, hardMaxAccuracy, hardMinShown, onHardMaxAccuracyChange, onHardMinShownChange, currentProfileLabel, onChangeProfile, profileId }: OptionsScreenProps) {
  const fontScale = useFontScale();

  async function openBundledPdf(assetModule: number) {
    try {
      const asset = Asset.fromModule(assetModule);
      if (!asset.downloaded) {
        await asset.downloadAsync();
      }

      const uri = asset.localUri ?? asset.uri;
      await openPdfUri(uri);
    } catch {
      Alert.alert("No se pudo abrir el PDF", "El archivo no está disponible en este momento.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderRow}>
        <Pressable style={styles.headerHomeButton} onPress={onGoHome}>
          <Text style={styles.headerHomeButtonText}>⌂ Inicio</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Opciones y Recursos</Text>
        <Text style={styles.subtitle}>
          Aquí centralizamos configuraciones futuras y material de estudio descargable.
        </Text>

        {currentProfileLabel !== undefined && (
          <View style={[styles.card, { borderWidth: 1, borderColor: theme.border }]}>
            <Text style={styles.cardTitle}>📋 Categoría de oposición</Text>
            <Text style={[styles.cardDescription, { marginTop: 4 }]}>
              Banco activo: <Text style={{ color: theme.primary, fontWeight: "bold" }}>{currentProfileLabel}</Text>
            </Text>
            {onChangeProfile && (
              <Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={onChangeProfile}>
                <Text style={styles.secondaryButtonText}>🔄 Cambiar categoría</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tamaño de letra</Text>
          <Text style={[styles.cardDescription, { marginTop: 8 }]}>Ajusta el tamaño global para preguntas, textos y botones. Se guarda automáticamente.</Text>

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.cardDescription, { marginBottom: 6 }]}>Escala actual: {Math.round(fontScale * 100)}%</Text>
            <Slider
              minimumValue={0.85}
              maximumValue={1.4}
              step={0.01}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor="#c8d4e3"
              thumbTintColor={theme.primaryDark}
              value={fontScale}
              onValueChange={onFontScaleChange}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
              <Text style={[styles.cardDescription, { fontSize: 11 }]}>85%</Text>
              <Text style={[styles.cardDescription, { fontSize: 11 }]}>100%</Text>
              <Text style={[styles.cardDescription, { fontSize: 11 }]}>140%</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {FONT_PRESETS.map((preset) => {
              const active = Math.abs(fontScale - preset) < 0.006;
              return (
                <Pressable
                  key={String(preset)}
                  style={[
                    styles.secondaryButton,
                    { marginTop: 0, paddingVertical: 10, paddingHorizontal: 12 },
                    active && { backgroundColor: "#e9f5f4", borderColor: theme.primaryDark },
                  ]}
                  onPress={() => onFontScaleChange(preset)}
                >
                  <Text style={styles.secondaryButtonText}>{Math.round(preset * 100)}%</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.cardDescription, { marginTop: 10 }]}>
            Vista previa de texto con el tamaño seleccionado.
          </Text>
          <Pressable style={[styles.primaryButton, { marginTop: 10 }]}>
            <Text style={styles.primaryButtonText}>Botón de ejemplo</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Umbral de preguntas difíciles</Text>
          <Text style={[styles.cardDescription, { marginTop: 6 }]}>
            Define qué preguntas se consideran difíciles para la Práctica Difícil y el filtro del banco.
          </Text>

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.cardDescription, { marginBottom: 4 }]}>
              Precisión máxima: {hardMaxAccuracy}%
            </Text>
            <Slider
              minimumValue={20}
              maximumValue={90}
              step={5}
              minimumTrackTintColor={theme.danger}
              maximumTrackTintColor="#c8d4e3"
              thumbTintColor={theme.danger}
              value={hardMaxAccuracy}
              onValueChange={(v) => onHardMaxAccuracyChange(Math.round(v))}
            />
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={[styles.cardDescription, { marginBottom: 4 }]}>
              Mínimo de apariciones: {hardMinShown}
            </Text>
            <Slider
              minimumValue={1}
              maximumValue={15}
              step={1}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor="#c8d4e3"
              thumbTintColor={theme.primaryDark}
              value={hardMinShown}
              onValueChange={(v) => onHardMinShownChange(Math.round(v))}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📚 Temario en PDF</Text>
          <Text style={[styles.cardDescription, { marginTop: 6, marginBottom: 10 }]}>
            Material de estudio disponible para tu categoría.
          </Text>

          {/* Común A/B/C1 — disponible para enfermería y técnico superior */}
          {(profileId === "enfermeria" || profileId === "tecnico_superior" || !profileId) && (
            <>
              <Text style={[styles.cardTitle, { marginTop: 2 }]}>1) Temario Común A/B/C1</Text>
              {PDFS_COMUN_ABC1.map((pdf) => (
                <Pressable
                  key={pdf.code}
                  style={[styles.secondaryButton, { marginTop: 8 }]}
                  onPress={() => void openBundledPdf(pdf.module)}
                >
                  <Text style={styles.secondaryButtonText}>📄 {pdf.code} {pdf.title}</Text>
                </Pressable>
              ))}
            </>
          )}

          {/* Enfermería específico */}
          {(profileId === "enfermeria" || !profileId) && (
            <>
              <Text style={[styles.cardTitle, { marginTop: 14 }]}>2) Temario Específico Enfermería</Text>
              {PDFS_ENFERMERIA.map((pdf) => (
                <Pressable
                  key={pdf.code}
                  style={[styles.secondaryButton, { marginTop: 8 }]}
                  onPress={() => void openBundledPdf(pdf.module)}
                >
                  <Text style={styles.secondaryButtonText}>📄 {pdf.code} {pdf.title}</Text>
                </Pressable>
              ))}
            </>
          )}

          {/* Técnico Superior — sin temario específico todavía */}
          {profileId === "tecnico_superior" && (
            <View style={{ marginTop: 14, padding: 10, backgroundColor: "#f4f9ff", borderRadius: 8, borderWidth: 1, borderColor: "#c8dce8" }}>
              <Text style={[styles.cardDescription, { color: theme.textMuted }]}>📭 Temario específico de Técnico Superior no disponible aún.</Text>
            </View>
          )}

          {/* Celador — sin temario disponible */}
          {profileId === "celador" && (
            <View style={{ marginTop: 8, padding: 10, backgroundColor: "#f4f9ff", borderRadius: 8, borderWidth: 1, borderColor: "#c8dce8" }}>
              <Text style={[styles.cardDescription, { color: theme.textMuted }]}>📭 Temario en PDF no disponible para Celador/a aún.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
