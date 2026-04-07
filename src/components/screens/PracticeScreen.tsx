import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { OptionButton } from "../OptionButton";
import { Question } from "../../types";
import { styles } from "../../styles/appStyles";

type PracticeScreenProps = {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  practiceMode: "random-list" | "failed-list";
  practiceSelected: number | null;
  practiceAnswered: boolean;
  practiceIsCorrect: boolean;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  onGoHome: () => void;
};

export function PracticeScreen({
  question,
  currentIndex,
  totalQuestions,
  practiceMode,
  practiceSelected,
  practiceAnswered,
  practiceIsCorrect,
  onAnswer,
  onNext,
  onGoHome,
}: PracticeScreenProps) {
  const progressText =
    practiceMode === "failed-list" ? "Listado de preguntas falladas" : "Listado aleatorio";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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

        {practiceAnswered && (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackTitle}>{practiceIsCorrect ? "Correcta" : "Incorrecta"}</Text>
            <Text style={styles.feedbackText}>
              Respuesta correcta: {String.fromCharCode(65 + question.correctIndex)}.
            </Text>
            {question.explanation ? <Text style={styles.feedbackText}>{question.explanation}</Text> : null}
          </View>
        )}

        <Pressable
          style={[styles.primaryButton, !practiceAnswered && styles.disabledButton]}
          onPress={onNext}
          disabled={!practiceAnswered}
        >
          <Text style={styles.primaryButtonText}>
            {currentIndex >= totalQuestions - 1 ? "Volver a Inicio" : "Siguiente"}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onGoHome}>
          <Text style={styles.secondaryButtonText}>Volver a Inicio</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
