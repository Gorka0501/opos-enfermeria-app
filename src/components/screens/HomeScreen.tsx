import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { styles } from "../../styles/appStyles";

type HomeScreenProps = {
  totalQuestions: number;
  failedCount: number;
  totalAccuracy: string;
  examCountInput: string;
  onExamCountChange: (value: string) => void;
  onStartExam: () => void;
  onStartRandomPractice: () => void;
  onStartFailedPractice: () => void;
  onOpenStats: () => void;
};

export function HomeScreen({
  totalQuestions,
  failedCount,
  totalAccuracy,
  examCountInput,
  onExamCountChange,
  onStartExam,
  onStartRandomPractice,
  onStartFailedPractice,
  onOpenStats,
}: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Oposiciones Enfermeria</Text>
        <Text style={styles.subtitle}>
          Menu principal de estudio. Elige entre examen configurable, practica aleatoria,
          preguntas falladas y estadisticas.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Banco total</Text>
          <Text style={styles.cardNumber}>{totalQuestions} preguntas</Text>
          <Text style={styles.cardDescription}>Acierto global: {totalAccuracy}%</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preguntas falladas</Text>
          <Text style={styles.cardNumber}>{failedCount}</Text>
          <Text style={styles.cardDescription}>Se actualiza en examen y practica.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Examen configurable</Text>
          <Text style={styles.cardDescription}>Cuantas preguntas quieres en el examen?</Text>
          <TextInput
            value={examCountInput}
            onChangeText={onExamCountChange}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="Numero de preguntas"
            placeholderTextColor="#7c95a8"
          />
          <Pressable style={styles.primaryButton} onPress={onStartExam}>
            <Text style={styles.primaryButtonText}>Empezar Examen</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={onStartRandomPractice}>
          <Text style={styles.primaryButtonText}>Practica Aleatoria (con correccion)</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, failedCount === 0 && styles.disabledButton]}
          onPress={onStartFailedPractice}
          disabled={failedCount === 0}
        >
          <Text style={styles.secondaryButtonText}>Listado de Falladas</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onOpenStats}>
          <Text style={styles.secondaryButtonText}>Ver Estadisticas</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
