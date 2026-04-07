import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { OptionButton } from "../OptionButton";
import { Question } from "../../types";
import { styles } from "../../styles/appStyles";

type ExamScreenProps = {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer?: number;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  onGoHome: () => void;
};

export function ExamScreen({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  onNext,
  onGoHome,
}: ExamScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.progress}>
          Examen · Pregunta {currentIndex + 1} de {totalQuestions}
        </Text>

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

        <Pressable
          style={[styles.primaryButton, selectedAnswer === undefined && styles.disabledButton]}
          onPress={onNext}
          disabled={selectedAnswer === undefined}
        >
          <Text style={styles.primaryButtonText}>
            {currentIndex >= totalQuestions - 1 ? "Finalizar Examen" : "Siguiente"}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onGoHome}>
          <Text style={styles.secondaryButtonText}>Volver a Inicio</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}