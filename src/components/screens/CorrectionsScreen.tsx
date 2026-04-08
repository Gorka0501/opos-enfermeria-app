import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from "../AppText";
import { Question } from "../../types";
import { styles, theme } from "../../styles/appStyles";
import { isSubmitConfigured } from "../../utils/githubCorrections";

type CorrectionsScreenProps = {
  questions: Question[];
  originalQuestions: Question[];
  corrections: Record<string, number>;
  onSaveCorrection: (questionId: string, optionIndex: number) => void;
  onResetCorrection: (questionId: string) => void;
  onResetAllCorrections: () => void;
  onSubmitCorrections: () => Promise<void>;
  onGoHome: () => void;
};

export function CorrectionsScreen({
  questions,
  originalQuestions,
  corrections,
  onSaveCorrection,
  onResetCorrection,
  onResetAllCorrections,
  onSubmitCorrections,
  onGoHome,
}: CorrectionsScreenProps) {
  const [tab, setTab] = useState<"browse" | "list">("browse");
  const [search, setSearch] = useState("");
  const [index, setIndex] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const originalById = useMemo(
    () => Object.fromEntries(originalQuestions.map((question) => [question.id, question])),
    [originalQuestions],
  );

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return questions;
    }

    return questions.filter((question) => {
      return (
        question.id.toLowerCase().includes(term) ||
        question.question.toLowerCase().includes(term) ||
        question.options.some((option) => option.toLowerCase().includes(term)) ||
        (question.source ?? "").toLowerCase().includes(term)
      );
    });
  }, [questions, search]);

  useEffect(() => {
    setIndex(0);
  }, [search]);

  useEffect(() => {
    if (index >= filteredQuestions.length) {
      setIndex(Math.max(0, filteredQuestions.length - 1));
    }
  }, [filteredQuestions.length, index]);

  const currentQuestion = filteredQuestions[index];
  const originalQuestion = currentQuestion ? originalById[currentQuestion.id] : undefined;
  const originalCorrectIndex = originalQuestion?.correctIndex;
  const hasOverride = currentQuestion ? corrections[currentQuestion.id] !== undefined : false;

  const correctionEntries = useMemo(
    () =>
      Object.entries(corrections).map(([questionId, newIndex]) => {
        const orig = originalById[questionId];
        return { questionId, newIndex, orig };
      }),
    [corrections, originalById],
  );

  async function handleSubmit() {
    setSubmitStatus("loading");
    setSubmitError("");
    try {
      await onSubmitCorrections();
      setSubmitStatus("ok");
    } catch (e) {
      setSubmitStatus("error");
      setSubmitError(e instanceof Error ? e.message : "Error desconocido");
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
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.title}>Correcciones del Sistema</Text>
        </View>

        {/* Tab switcher */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <Pressable
            style={[styles.secondaryButton, { flex: 1, marginTop: 0 }, tab === "browse" && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setTab("browse")}
          >
            <Text style={[styles.secondaryButtonText, tab === "browse" && { color: theme.surface }]}>Corregir</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, { flex: 1, marginTop: 0 }, tab === "list" && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setTab("list")}
          >
            <Text style={[styles.secondaryButtonText, tab === "list" && { color: theme.surface }]}>
              Mis correcciones ({Object.keys(corrections).length})
            </Text>
          </Pressable>
        </View>

        {Object.keys(corrections).length > 0 && (
          <Pressable
            style={[styles.secondaryButton, { marginTop: 0, marginBottom: 12, alignSelf: "stretch" }]}
            onPress={onResetAllCorrections}
          >
            <Text style={[styles.secondaryButtonText, { textAlign: "center" }]}>Restablecer correcciones</Text>
          </Pressable>
        )}

        {tab === "list" ? (
          <>
            {correctionEntries.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardDescription}>Aún no has guardado ninguna corrección.</Text>
              </View>
            ) : (
              <>
                {!isSubmitConfigured() && (
                  <View style={[styles.card, { marginBottom: 10 }]}>
                    <Text style={styles.cardTitle}>Token no configurado</Text>
                    <Text style={styles.cardDescription}>
                      Para habilitar "Enviar al desarrollador", configura GITHUB_WRITE_TOKEN en src/utils/githubCorrections.ts.
                    </Text>
                  </View>
                )}

                {isSubmitConfigured() && (
                  <>
                    <Pressable
                      style={[
                        styles.primaryButton,
                        { marginBottom: 8, backgroundColor: theme.success ?? theme.primary },
                        submitStatus === "loading" && styles.disabledButton,
                      ]}
                      onPress={() => void handleSubmit()}
                      disabled={submitStatus === "loading"}
                    >
                      {submitStatus === "loading" ? (
                        <ActivityIndicator color={theme.surface} />
                      ) : (
                        <Text style={styles.primaryButtonText}>📨 Enviar al desarrollador</Text>
                      )}
                    </Pressable>
                    {submitStatus === "ok" && (
                      <Text style={[styles.feedbackText, { color: theme.success ?? theme.primary, marginBottom: 8 }]}>
                        ✓ Correcciones enviadas correctamente
                      </Text>
                    )}
                    {submitStatus === "error" && (
                      <Text style={[styles.feedbackText, { color: theme.danger ?? theme.textMuted, marginBottom: 8 }]}>
                        Error: {submitError}
                      </Text>
                    )}
                  </>
                )}
                {correctionEntries.map(({ questionId, newIndex, orig }) => (
                  <View key={questionId} style={[styles.card, { marginBottom: 10 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={styles.cardTitle}>{questionId}</Text>
                      <Pressable onPress={() => onResetCorrection(questionId)}>
                        <Text style={[styles.secondaryButtonText, { fontSize: 12, color: theme.danger ?? theme.textMuted }]}>✕ Revertir</Text>
                      </Pressable>
                    </View>
                    {orig && (
                      <>
                        <Text style={[styles.cardDescription, { marginBottom: 6 }]} numberOfLines={3}>{orig.question}</Text>
                        <View style={styles.feedbackBox}>
                          <Text style={styles.feedbackText}>Original: {orig.correctIndex + 1}. {orig.options[orig.correctIndex]}</Text>
                          <Text style={styles.feedbackText}>Propuesta: {newIndex + 1}. {orig.options[newIndex]}</Text>
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </>
            )}
          </>
        ) : (
        <>
        <Text style={[styles.subtitle, { marginBottom: 8 }]}>
          Cambia qué opción se considera correcta cuando una pregunta esté mal cargada. El cambio se guarda solo en este dispositivo.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Buscar pregunta</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.input}
            placeholder="Busca por ID, texto o respuesta"
            placeholderTextColor={theme.textMuted}
          />
          <Text style={[styles.cardDescription, { marginTop: 8 }]}>Resultados: {filteredQuestions.length}</Text>
        </View>

        {currentQuestion ? (
          <>
            <View style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={styles.cardTitle}>Pregunta {index + 1} de {filteredQuestions.length}</Text>
                <Text style={styles.cardDescription}>{currentQuestion.id}</Text>
              </View>

              <Text style={styles.question}>{currentQuestion.question}</Text>

              <View style={[styles.feedbackBox, { marginTop: 14 }]}> 
                <Text style={styles.feedbackText}>
                  Respuesta original: {originalCorrectIndex !== undefined ? originalCorrectIndex + 1 : "-"}
                </Text>
                <Text style={styles.feedbackText}>
                  Respuesta actual: {currentQuestion.correctIndex + 1}
                </Text>
                <Text style={styles.feedbackText}>
                  Estado: {hasOverride ? "corregida localmente" : "sin corrección local"}
                </Text>
              </View>

              <View style={[styles.optionsContainer, { marginTop: 16 }]}> 
                {currentQuestion.options.map((option, optionIndex) => {
                  const isCurrentCorrect = optionIndex === currentQuestion.correctIndex;
                  const isOriginalCorrect = optionIndex === originalCorrectIndex;

                  return (
                    <Pressable
                      key={`${currentQuestion.id}-${optionIndex}`}
                      style={[
                        styles.optionButton,
                        isCurrentCorrect && styles.optionCorrect,
                        !isCurrentCorrect && isOriginalCorrect && { borderColor: theme.warning, borderWidth: 2 },
                      ]}
                      onPress={() => onSaveCorrection(currentQuestion.id, optionIndex)}
                    >
                      <Text style={[styles.optionText, isCurrentCorrect && styles.optionTextSelected]}>
                        {optionIndex + 1}. {option}
                      </Text>
                      <Text style={{ marginTop: 6, color: isCurrentCorrect ? theme.surface : theme.textMuted, fontSize: 12, fontWeight: "600" }}>
                        {isCurrentCorrect
                          ? "Correcta actual"
                          : isOriginalCorrect
                          ? "Marcada como correcta en origen"
                          : "Tocar para marcar como correcta"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {hasOverride && (
                <Pressable
                  style={[styles.secondaryButton, { marginTop: 12 }]}
                  onPress={() => onResetCorrection(currentQuestion.id)}
                >
                  <Text style={styles.secondaryButtonText}>Restaurar respuesta original</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardDescription}>No hay preguntas que coincidan con la búsqueda.</Text>
          </View>
        )}
        </>
        )}
      </ScrollView>

      {tab === "browse" && <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              style={[styles.secondaryButton, { flex: 1, marginTop: 0 }, index === 0 && styles.disabledButton]}
              onPress={() => setIndex((prev) => Math.max(0, prev - 1))}
              disabled={index === 0 || filteredQuestions.length === 0}
            >
              <Text style={styles.secondaryButtonText}>← Anterior</Text>
            </Pressable>

            <Pressable
              style={[
                styles.primaryButton,
                { flex: 1, marginTop: 0 },
                (filteredQuestions.length === 0 || index >= filteredQuestions.length - 1) && styles.disabledButton,
              ]}
              onPress={() => setIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
              disabled={filteredQuestions.length === 0 || index >= filteredQuestions.length - 1}
            >
              <Text style={styles.primaryButtonText}>Siguiente →</Text>
            </Pressable>
          </View>
        </View>
      </View>}
    </SafeAreaView>
  );
}