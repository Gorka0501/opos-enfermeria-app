import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from "../AppText";
import { styles, theme } from "../../styles/appStyles";

type HomeScreenProps = {
  totalQuestions: number;
  failedCount: number;
  correctionCount: number;
  hardCount: number;
  totalAccuracy: string;
  examCountInput: string;
  onExamCountChange: (value: string) => void;
  onStartExam: () => void;
  onStartRandomPractice: () => void;
  onStartFailedPractice: () => void;
  onOpenCorrections: () => void;
  onStartHardPractice: () => void;
  onOpenStats: () => void;
  onOpenQuestionList?: () => void;
  onOpenOptions?: () => void;
};

export function HomeScreen({
  totalQuestions,
  failedCount,
  correctionCount,
  hardCount,
  totalAccuracy,
  examCountInput,
  onExamCountChange,
  onStartExam,
  onStartRandomPractice,
  onStartFailedPractice,
  onOpenCorrections,
  onStartHardPractice,
  onOpenStats,
  onOpenQuestionList,
  onOpenOptions,
}: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Oposiciones Enfermeria</Text>
        <Text style={styles.subtitle}>
          Elige un modo según tu objetivo: simular examen, entrenar o revisar progreso.
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: "#f2fbfa",
              borderColor: "#c8ece8",
            },
          ]}
        >
          <Text style={styles.cardTitle}>Tu acierto global</Text>
          <Text style={[styles.cardNumber, { fontSize: 54, color: theme.primary }]}>{totalAccuracy}%</Text>
          <Text style={styles.cardDescription}>Banco disponible: {totalQuestions} preguntas</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Simulacro de examen</Text>
          <Text style={styles.cardDescription}>Configura número de preguntas y haz un examen completo.</Text>
          <TextInput
            value={examCountInput}
            onChangeText={onExamCountChange}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="Numero de preguntas"
            placeholderTextColor={theme.textMuted}
          />
          <Pressable style={styles.primaryButton} onPress={onStartExam}>
            <Text style={styles.primaryButtonText}>Empezar Examen</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Modo práctica</Text>
          <Text style={styles.cardDescription}>Entrena sin presión con repaso general, preguntas falladas o preguntas difíciles.</Text>

          <Pressable style={styles.primaryButton} onPress={onStartRandomPractice}>
            <Text style={styles.primaryButtonText}>Práctica Aleatoria</Text>
          </Pressable>
          <Text style={[styles.cardDescription, { marginTop: 6 }]}>Repaso general del banco con corrección inmediata.</Text>

          <Pressable
            style={[styles.secondaryButton, { marginTop: 12 }, failedCount === 0 && styles.disabledButton]}
            onPress={onStartFailedPractice}
            disabled={failedCount === 0}
          >
            <Text style={styles.secondaryButtonText}>🎯 Práctica de Errores</Text>
          </Pressable>
          <Text style={[styles.cardDescription, { marginTop: 6 }]}>Repite solo las preguntas falladas para reforzar puntos débiles.</Text>

          <Pressable
            style={[styles.secondaryButton, { marginTop: 10 }, hardCount === 0 && styles.disabledButton]}
            onPress={onStartHardPractice}
            disabled={hardCount === 0}
          >
            <Text style={styles.secondaryButtonText}>🔥 Práctica Difícil</Text>
          </Pressable>
          <Text style={[styles.cardDescription, { marginTop: 6 }]}>Sesión libre para entrenar velocidad, memoria y preguntas complejas.</Text>
          <Text style={[styles.cardDescription, { marginTop: 4 }]}>Pendientes de repaso: {failedCount}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Correcciones</Text>
          <Text style={styles.cardDescription}>Corrige respuestas que estén mal marcadas en el sistema y guarda el cambio en tu dispositivo.</Text>

          <Pressable style={styles.primaryButton} onPress={onOpenCorrections}>
            <Text style={styles.primaryButtonText}>🛠 Abrir Correcciones</Text>
          </Pressable>
          <Text style={[styles.cardDescription, { marginTop: 6 }]}>Correcciones guardadas: {correctionCount}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seguimiento</Text>
          <Text style={styles.cardDescription}>Consulta estadísticas y gestiona el banco de preguntas.</Text>
          <Pressable style={styles.secondaryButton} onPress={onOpenStats}>
            <Text style={styles.secondaryButtonText}>Ver Estadisticas</Text>
          </Pressable>

          {onOpenQuestionList && (
            <Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={onOpenQuestionList}>
              <Text style={styles.secondaryButtonText}>📚 Banco de Preguntas</Text>
            </Pressable>
          )}

          {onOpenOptions && (
            <Pressable style={[styles.secondaryButton, { marginTop: 10 }]} onPress={onOpenOptions}>
              <Text style={styles.secondaryButtonText}>⚙️ Opciones y Recursos</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
