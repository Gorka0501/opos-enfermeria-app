import React from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { styles } from "../../styles/appStyles";

type ExamResultScreenProps = {
  score: number;
  totalQuestions: number;
  onRepeatExam: () => void;
  onGoHome: () => void;
};

export function ExamResultScreen({
  score,
  totalQuestions,
  onRepeatExam,
  onGoHome,
}: ExamResultScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Resultado del Examen</Text>
        <Text style={styles.score}>
          {score} / {totalQuestions}
        </Text>
        <Text style={styles.subtitle}>
          El listado de falladas y tus estadisticas ya se han actualizado.
        </Text>

        <Pressable style={styles.primaryButton} onPress={onRepeatExam}>
          <Text style={styles.primaryButtonText}>Repetir Examen</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onGoHome}>
          <Text style={styles.secondaryButtonText}>Volver a Inicio</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
