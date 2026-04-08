import { useMemo, useRef } from "react";
import { PanResponder, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from "../AppText";
import { OptionButton } from "../OptionButton";
import { Question } from "../../types";
import { styles, theme } from "../../styles/appStyles";

type ExamScreenProps = {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer?: number;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
  onGoHome: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  answeredQuestions?: Set<number>;
  onNavigate?: (index: number) => void;
};

export function ExamScreen({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  onNext,
  onPrev,
  onFinish,
  onGoHome,
  isFavorite,
  onToggleFavorite,
  answeredQuestions,
  onNavigate,
}: ExamScreenProps) {
  const progressPercentage = Math.round(((currentIndex + 1) / totalQuestions) * 100);
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
    [currentIndex, onNext, onPrev, totalQuestions],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderRow}>
        <Pressable style={styles.headerHomeButton} onPress={onGoHome}>
          <Text style={styles.headerHomeButtonText}>⌂ Inicio</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, styles.contentWithBottomBar]} {...panResponder.panHandlers}>
        {/* Progress Bar */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={styles.progress}>
              Examen · Pregunta {currentIndex + 1} de {totalQuestions}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: theme.primary }}>
              {progressPercentage}%
            </Text>
          </View>
          <View
            style={{
              height: 8,
              backgroundColor: "#e0e0e0",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                backgroundColor: theme.primary,
                width: `${progressPercentage}%`,
              }}
            />
          </View>
        </View>

        <Text style={styles.question}>{question.question}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option: string, index: number) => (
            <OptionButton
              key={`${question.id}-${index}`}
              index={index}
              text={option}
              isSelected={selectedAnswer === index}
              onPress={() => onAnswer(index)}
            />
          ))}
        </View>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: 12,
              marginVertical: 4,
            }}
            onPress={onToggleFavorite}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>
              {isFavorite ? "⭐" : "☆"}
            </Text>
            <Text style={{ color: theme.primary, fontWeight: "600" }}>
              {isFavorite ? "Eliminar de favoritas" : "Guardar como favorita"}
            </Text>
          </Pressable>
        )}

        <Text style={{ fontSize: 12, color: "#666", textAlign: "center", marginTop: 6 }}>
          El examen solo termina cuando pulses "Acabar examen".
        </Text>

        {/* Question Mini-Map */}
        <View style={{ marginTop: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textMuted, marginBottom: 8 }}>
            Preguntas respondidas: {answeredQuestions?.size || 0}/{totalQuestions}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const isAnswered = answeredQuestions?.has(idx) || false;
              const isCurrent = idx === currentIndex;
              return (
                <Pressable
                  key={idx}
                  onPress={() => onNavigate?.(idx)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor: isCurrent
                      ? theme.primary
                      : isAnswered
                      ? theme.answered
                      : "#f0f0f0",
                    borderWidth: isCurrent ? 2 : 1,
                    borderColor: isCurrent ? theme.primary : isAnswered ? theme.warning : "#ddd",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "bold",
                      color: isCurrent ? "#fff" : isAnswered ? "#7a5c00" : "#999",
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
            style={[styles.secondaryButton, { flex: 1, marginTop: 0 }, currentIndex === 0 && styles.disabledButton]}
            onPress={onPrev}
            disabled={currentIndex === 0}
          >
            <Text style={styles.secondaryButtonText}>← Anterior</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, { flex: 1, marginTop: 0 }, currentIndex >= totalQuestions - 1 && styles.disabledButton]}
            onPress={onNext}
            disabled={currentIndex >= totalQuestions - 1}
          >
            <Text style={styles.primaryButtonText}>Siguiente →</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.primaryButton, { marginTop: 10, backgroundColor: theme.danger }]} onPress={onFinish}>
          <Text style={styles.primaryButtonText}>Acabar examen</Text>
        </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}