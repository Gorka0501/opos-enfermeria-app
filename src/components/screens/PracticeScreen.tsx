import { useMemo, useRef } from "react";
import { Alert, PanResponder, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from "../AppText";
import { Asset } from "expo-asset";
import { OptionButton } from "../OptionButton";
import { Question } from "../../types";
import { openPdfUri } from "../../utils/openPdf";
import { styles, theme } from "../../styles/appStyles";

type PracticeScreenProps = {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  practiceMode: "random-list" | "failed-list" | "favorites" | "hard-list";
  practiceSelected: number | null;
  practiceAnswered: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoHome: () => void;
};

export function PracticeScreen({
  question,
  currentIndex,
  totalQuestions,
  practiceMode,
  practiceSelected,
  practiceAnswered,
  isFavorite,
  onToggleFavorite,
  onAnswer,
  onNext,
  onPrev,
  onGoHome,
}: PracticeScreenProps) {
  const didSwipeRef = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 16 && Math.abs(gestureState.dy) < 12,
        onPanResponderGrant: () => {
          didSwipeRef.current = false;
        },
        onPanResponderMove: (_, gestureState) => {
          if (didSwipeRef.current) return;

          if (gestureState.dx < -52 && currentIndex < totalQuestions - 1) {
            didSwipeRef.current = true;
            onNext();
          } else if (gestureState.dx > 52 && currentIndex > 0) {
            didSwipeRef.current = true;
            onPrev();
          }
        },
      }),
    [currentIndex, onNext, onPrev, practiceAnswered, totalQuestions],
  );

  // filename → readable label
  function formatSource(src: string): string {
    if (src.includes("comun")) return "Temario Común – Preguntas";
    if (src.includes("enfermeria_500") || src.includes("enfermero_500")) return "Temario Enfermería – Preguntas";
    return src;
  }

  function getSourcePdfModule(): number | null {
    const src = question.source ?? "";
    if (src.includes("comun")) return require("../../../assets/temario/temario_comun_200_preguntas_cas.pdf") as number;
    if (src.includes("enfermeria") || src.includes("enfermero_500")) return require("../../../assets/temario/temario_enfermeria_500_preguntas_cas.pdf") as number;
    return null;
  }

  async function openSourcePdf() {
    const mod = getSourcePdfModule();
    if (!mod) return;
    try {
      const asset = Asset.fromModule(mod);
      if (!asset.downloaded) await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      await openPdfUri(uri);
    } catch {
      Alert.alert("Error", "No se pudo abrir el temario.");
    }
  }

  const progressText =
    practiceMode === "failed-list"
      ? "Listado de preguntas falladas"
      : practiceMode === "favorites"
      ? "Preguntas favoritas"
      : practiceMode === "hard-list"
      ? "Práctica Difícil"
      : "Listado aleatorio";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderRow}>
        <Pressable style={styles.headerHomeButton} onPress={onGoHome}>
          <Text style={styles.headerHomeButtonText}>⌂ Inicio</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, styles.contentWithBottomBar]} {...panResponder.panHandlers}>
        <Text style={styles.progress}>
          {progressText} · {currentIndex + 1} / {totalQuestions}
        </Text>

        <Text style={styles.question}>{question.question}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option: string, index: number) => {
            const isSelected = practiceSelected === index;
            const isCorrectOption = index === question.correctIndex;

            return (
              <OptionButton
                key={`${question.id}-${index}`}
                index={index}
                text={option}
                disabled={practiceAnswered}
                isCorrect={practiceAnswered && isCorrectOption}
                isWrong={practiceAnswered && isSelected && !isCorrectOption}
                onPress={() => onAnswer(index)}
              />
            );
          })}
        </View>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, marginTop: 4 }}
            onPress={onToggleFavorite}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>{isFavorite ? "⭐" : "☆"}</Text>
            <Text style={{ color: theme.primary, fontWeight: "600" }}>
              {isFavorite ? "Eliminar de favoritas" : "Guardar como favorita"}
            </Text>
          </Pressable>
        )}

        {practiceAnswered && (
          <View style={styles.feedbackBox}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={styles.feedbackText}>ID: {question.id}</Text>
              <Pressable onPress={openSourcePdf} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 14 }}>📄</Text>
                <Text style={[styles.feedbackText, { color: theme.primary, textDecorationLine: "underline" }]}>
                  {formatSource(question.source ?? "")}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
        <Pressable
          style={[styles.secondaryButton, { marginTop: 0, marginBottom: 10 }, currentIndex === 0 && styles.disabledButton]}
          onPress={onPrev}
          disabled={currentIndex === 0}
        >
          <Text style={styles.secondaryButtonText}>← Anterior</Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, { marginTop: 0 }]}
          onPress={onNext}
        >
          <Text style={styles.primaryButtonText}>
            {currentIndex >= totalQuestions - 1
              ? "Finalizar práctica"
              : practiceAnswered
                ? "Siguiente →"
                : "Saltar pregunta →"}
          </Text>
        </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
