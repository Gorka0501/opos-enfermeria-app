import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { AppStats } from "../../types";
import { styles } from "../../styles/appStyles";

type StatsScreenProps = {
  stats: AppStats;
  totalAccuracy: string;
  practiceAccuracy: string;
  onGoHome: () => void;
};

export function StatsScreen({
  stats,
  totalAccuracy,
  practiceAccuracy,
  onGoHome,
}: StatsScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Estadisticas</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rendimiento global</Text>
          <Text style={styles.cardNumber}>{totalAccuracy}%</Text>
          <Text style={styles.cardDescription}>
            {stats.totalCorrect} aciertos de {stats.totalAnswered} respuestas
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Examenes completados</Text>
          <Text style={styles.cardNumber}>{stats.examsCompleted}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Practica</Text>
          <Text style={styles.cardNumber}>{practiceAccuracy}%</Text>
          <Text style={styles.cardDescription}>
            {stats.practiceCorrect} aciertos de {stats.practiceAnswered} respuestas
          </Text>
        </View>

        <Pressable style={styles.secondaryButton} onPress={onGoHome}>
          <Text style={styles.secondaryButtonText}>Volver a Inicio</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
