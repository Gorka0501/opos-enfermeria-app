import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from "../AppText";
import { Asset } from "expo-asset";
import { Question } from "../../types";
import { openPdfUri } from "../../utils/openPdf";
import { styles, theme } from "../../styles/appStyles";

type ExamResultScreenProps = {
  score: number;
  totalQuestions: number;
  questions: Question[];
  answers: Record<string, number>;
  onRepeatExam: () => void;
  onStartAnotherExam: () => void;
  onGoHome: () => void;
};

export function ExamResultScreen({
  score,
  totalQuestions,
  questions,
  answers,
  onRepeatExam,
  onStartAnotherExam,
  onGoHome,
}: ExamResultScreenProps) {
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const accuracy = Math.round((score / totalQuestions) * 100);

  // ── Summary view ─────────────────────────────────────────────────────────
  if (reviewIndex === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topHeaderRow}>
          <Pressable style={styles.headerHomeButton} onPress={onGoHome}>
            <Text style={styles.headerHomeButtonText}>⌂ Inicio</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, styles.contentWithBottomBar]}>
          <Text style={styles.title}>Resultado del Examen</Text>
          <Text style={styles.score}>
            {score} / {totalQuestions}
          </Text>
          <Text style={styles.subtitle}>{accuracy}% correcto</Text>

          {/* Question map */}
          <Text style={[styles.subtitle, { marginTop: 20, marginBottom: 8 }]}>
            Toca una pregunta para revisarla
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {questions.map((q, idx) => {
              const hasAnswer = answers[q.id] !== undefined;
              const isCorrect = hasAnswer && answers[q.id] === q.correctIndex;
              return (
                <Pressable
                  key={q.id}
                  onPress={() => setReviewIndex(idx)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    backgroundColor: isCorrect ? "#d4edda" : "#f8d7da",
                    borderWidth: 2,
                    borderColor: isCorrect ? theme.success : theme.danger,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "bold",
                      color: isCorrect ? theme.success : theme.danger,
                    }}
                  >
                    {idx + 1}
                  </Text>
                </Pressable>
              );
            })}
          </View>

        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInner}>
          <Pressable style={[styles.primaryButton, { marginTop: 0 }]} onPress={onStartAnotherExam}>
            <Text style={styles.primaryButtonText}>Hacer otro</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { marginTop: 8 }]} onPress={onRepeatExam}>
            <Text style={styles.secondaryButtonText}>Repetir Examen</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { marginTop: 8 }]} onPress={onGoHome}>
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </Pressable>
            </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Review view (read-only, question by question) ─────────────────────────
  const question = questions[reviewIndex];
  const userAnswerIndex = answers[question.id];
  const isCorrect = userAnswerIndex === question.correctIndex;

  function formatSource(src: string): string {
    if (src.includes("comun")) return "Temario Común – Preguntas";
    if (src.includes("enfermeria_500") || src.includes("enfermero_500")) return "Temario Enfermería – Preguntas";
    return src;
  }

  function getSourcePdfModule(): number | null {
    const collection = question.id.match(/^(.+)_\d+$/)?.[1] ?? "";
    if (collection === "A_B_C1") return require("../../../assets/temario/temario_comun_200_preguntas_cas.pdf") as number;
    if (collection === "Enfermeria") return require("../../../assets/temario/temario_enfermeria_500_preguntas_cas.pdf") as number;
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderRow}>
        <Pressable style={styles.headerHomeButton} onPress={onGoHome}>
          <Text style={styles.headerHomeButtonText}>⌂ Inicio</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, styles.contentWithBottomBar]}>
        <Text style={styles.progress}>
          Revisión · Pregunta {reviewIndex + 1} de {totalQuestions}
        </Text>

        {/* Progress bar */}
        <View style={{ height: 6, backgroundColor: "#e0e0e0", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
          <View
            style={{
              height: "100%",
              backgroundColor: isCorrect ? theme.success : theme.danger,
              width: `${((reviewIndex + 1) / totalQuestions) * 100}%`,
            }}
          />
        </View>

        <Text style={styles.question}>{question.question}</Text>

        {/* Options read-only */}
        <View style={[styles.optionsContainer, { marginTop: 16 }]}>
          {question.options.map((option, idx) => {
            const isUserAnswer = idx === userAnswerIndex;
            const isCorrectOption = idx === question.correctIndex;
            let bg = "#f9f9f9";
            let border = "#ddd";
            let textColor = theme.textStrong;
            let suffix = "";

            if (isCorrectOption) {
              bg = "#d4edda";
              border = theme.success;
              textColor = theme.success;
              suffix = " ✓";
            } else if (isUserAnswer && !isCorrectOption) {
              bg = "#f8d7da";
              border = theme.danger;
              textColor = theme.danger;
              suffix = " ✗";
            }

            return (
              <View
                key={idx}
                style={{
                  backgroundColor: bg,
                  borderWidth: 2,
                  borderColor: border,
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <Text style={{ fontSize: 15, color: textColor, fontWeight: isCorrectOption || isUserAnswer ? "600" : "400" }}>
                  {option}{suffix}
                </Text>
              </View>
            );
          })}
        </View>

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

        <View style={{ marginTop: 14, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textMuted, marginBottom: 8 }}>
            Preguntas del examen
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {questions.map((q, idx) => {
              const isCurrent = idx === reviewIndex;
              const hasAnswer = answers[q.id] !== undefined;
              const isCorrectIdx = hasAnswer && answers[q.id] === q.correctIndex;
              return (
                <Pressable
                  key={q.id}
                  onPress={() => setReviewIndex(idx)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: isCurrent
                      ? theme.primary
                      : isCorrectIdx
                      ? "#d4edda"
                      : "#f8d7da",
                    borderWidth: isCurrent ? 2 : 1,
                    borderColor: isCurrent
                      ? theme.primary
                      : isCorrectIdx
                      ? theme.success
                      : theme.danger,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "bold",
                      color: isCurrent
                        ? theme.surface
                        : isCorrectIdx
                        ? theme.success
                        : theme.danger,
                    }}
                  >
                    {idx + 1}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            style={[styles.secondaryButton, { flex: 1, marginTop: 0 }, reviewIndex === 0 && styles.disabledButton]}
            onPress={() => setReviewIndex((i) => (i !== null ? i - 1 : 0))}
            disabled={reviewIndex === 0}
          >
            <Text style={styles.secondaryButtonText}>← Anterior</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, { flex: 1, marginTop: 0 }, reviewIndex >= totalQuestions - 1 && styles.disabledButton]}
            onPress={() => setReviewIndex((i) => (i !== null ? i + 1 : 0))}
            disabled={reviewIndex >= totalQuestions - 1}
          >
            <Text style={styles.primaryButtonText}>Siguiente →</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.primaryButton, { marginTop: 10, backgroundColor: theme.danger }]} onPress={() => setReviewIndex(null)}>
          <Text style={styles.primaryButtonText}>Volver al resumen</Text>
        </Pressable>
          </View>
      </View>
    </SafeAreaView>
  );
}

