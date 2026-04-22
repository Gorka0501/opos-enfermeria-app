import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { AppText as Text } from "../AppText";
import { styles, theme } from "../../styles/appStyles";

type HomeScreenProps = {
  profileLabel: string;
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
  onRefreshQuestions?: () => void;
  updatingQuestions?: boolean;
  lastQuestionsUpdate?: number | null;
};

export function HomeScreen({
  profileLabel,
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
  onRefreshQuestions,
  updatingQuestions = false,
  lastQuestionsUpdate = null,
}: HomeScreenProps) {
  const [helpVisible, setHelpVisible] = useState(false);
  const cardSpacing = { gap: 10 } as const;

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón de ayuda flotante */}
      <Pressable
        onPress={() => setHelpVisible(true)}
        style={{
          position: "absolute",
          top: 48,
          right: 20,
          zIndex: 10,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: theme.primaryDark,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }}
        accessibilityLabel="Ayuda: cómo funciona la app"
      >
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18, lineHeight: 20 }}>?</Text>
      </Pressable>

      {/* Modal de ayuda */}
      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}
          onPress={() => setHelpVisible(false)}
        >
          <Pressable
            style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 24, gap: 12 }}
            onPress={() => {/* evita cerrar al tocar dentro */}}
          >
            <Text style={{ fontSize: 20, fontWeight: "800", color: theme.primaryDark, marginBottom: 4 }}>
              ¿Cómo funciona la app?
            </Text>

            <Text style={{ color: theme.text, lineHeight: 22 }}>
              <Text style={{ fontWeight: "700" }}>📝 Simulacro de examen{"\n"}</Text>
              Responde un número fijo de preguntas como si fuera el examen real. Al terminar ves tu nota y las respuestas correctas.
            </Text>

            <Text style={{ color: theme.text, lineHeight: 22 }}>
              <Text style={{ fontWeight: "700" }}>🎯 Práctica aleatoria{"\n"}</Text>
              Repasa preguntas una a una con corrección inmediata. El orden es inteligente: aparecen antes las que más fallas.
            </Text>

            <Text style={{ color: theme.text, lineHeight: 22 }}>
              <Text style={{ fontWeight: "700" }}>❌ Práctica de errores{"\n"}</Text>
              Solo muestra las preguntas que has fallado anteriormente. Se desbloquea cuando tienes al menos 1 error.
            </Text>

            <Text style={{ color: theme.text, lineHeight: 22 }}>
              <Text style={{ fontWeight: "700" }}>🔥 Práctica difícil{"\n"}</Text>
              Preguntas que has respondido varias veces con menos de un 50% de acierto. Para reforzar los puntos más débiles.
            </Text>

            <Text style={{ color: theme.text, lineHeight: 22 }}>
              <Text style={{ fontWeight: "700" }}>📊 Estadísticas{"\n"}</Text>
              Consulta tu evolución, historial de exámenes y rendimiento por pregunta.
            </Text>

            <Text style={{ color: theme.text, lineHeight: 22 }}>
              <Text style={{ fontWeight: "700" }}>📚 Banco de preguntas{"\n"}</Text>
              Gestiona todas las preguntas: excluye las que no quieras que aparezcan, marca favoritas y consulta el temario.
            </Text>

            <Text style={{ color: theme.text, lineHeight: 22 }}>
              <Text style={{ fontWeight: "700" }}>🛠 Correcciones{"\n"}</Text>
              Si una respuesta está mal, puedes corregirla localmente en tu dispositivo.
            </Text>

            <Pressable
              onPress={() => setHelpVisible(false)}
              style={{
                marginTop: 8,
                backgroundColor: theme.primary,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Entendido</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 52, gap: 14 }]}>
        <Text style={styles.title}>Oposiciones {profileLabel}</Text>
        <Text style={styles.subtitle}>Empieza por examen o práctica, y controla tu progreso desde un solo panel.</Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: "#f2fbfa",
              borderColor: "#c8ece8",
              gap: 12,
            },
          ]}
        >
          <Text style={styles.cardTitle}>Resumen rápido</Text>
          <Text style={[styles.cardNumber, { fontSize: 52, color: theme.primary }]}>{totalAccuracy}%</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <View style={{ backgroundColor: "#eaf7f5", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={[styles.cardDescription, { color: theme.primaryDark, fontWeight: "700" }]}>📚 {totalQuestions} preguntas</Text>
            </View>
            <View style={{ backgroundColor: "#fff1f1", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={[styles.cardDescription, { color: "#b23a48", fontWeight: "700" }]}>🎯 {failedCount} por repasar</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, cardSpacing]}>
          <Text style={styles.cardTitle}>Examen</Text>
          <Text style={styles.cardDescription}>Simula el examen con el número de preguntas que elijas.</Text>
          <TextInput
            value={examCountInput}
            onChangeText={onExamCountChange}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="Número de preguntas"
            placeholderTextColor={theme.textMuted}
          />
          <Pressable style={styles.primaryButton} onPress={onStartExam}>
            <Text style={styles.primaryButtonText}>📝 Empezar Examen</Text>
          </Pressable>
        </View>

        <View style={[styles.card, cardSpacing]}>
          <Text style={styles.cardTitle}>Práctica</Text>
          <Text style={styles.cardDescription}>Entrena rápido con el modo que necesites.</Text>

          <Pressable style={styles.primaryButton} onPress={onStartRandomPractice}>
            <Text style={styles.primaryButtonText}>🔀 Práctica Aleatoria</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, failedCount === 0 && styles.disabledButton]}
            onPress={onStartFailedPractice}
            disabled={failedCount === 0}
          >
            <Text style={styles.secondaryButtonText}>🎯 Práctica de Errores</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, hardCount === 0 && styles.disabledButton]}
            onPress={onStartHardPractice}
            disabled={hardCount === 0}
          >
            <Text style={styles.secondaryButtonText}>🔥 Práctica Difícil</Text>
          </Pressable>
        </View>

        <View style={[styles.card, cardSpacing]}>
          <Text style={styles.cardTitle}>Herramientas</Text>
          <Text style={styles.cardDescription}>Gestiona progreso, banco y configuración.</Text>

          <Pressable style={styles.secondaryButton} onPress={onOpenStats}>
            <Text style={styles.secondaryButtonText}>📊 Ver Estadísticas</Text>
          </Pressable>

          {onOpenQuestionList && (
            <Pressable style={styles.secondaryButton} onPress={onOpenQuestionList}>
              <Text style={styles.secondaryButtonText}>📚 Banco de Preguntas</Text>
            </Pressable>
          )}

          <Pressable style={styles.secondaryButton} onPress={onOpenCorrections}>
            <Text style={styles.secondaryButtonText}>🛠 Correcciones ({correctionCount})</Text>
          </Pressable>

          {onOpenOptions && (
            <Pressable style={styles.secondaryButton} onPress={onOpenOptions}>
              <Text style={styles.secondaryButtonText}>⚙️ Opciones y Recursos</Text>
            </Pressable>
          )}
        </View>

        {onRefreshQuestions && (
          <View style={[styles.card, cardSpacing]}>
            <Text style={styles.cardTitle}>Actualización de preguntas</Text>
            <Text style={styles.cardDescription}>
              {lastQuestionsUpdate
                ? `Última actualización: ${new Date(lastQuestionsUpdate).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Sin actualización remota aún (usando preguntas incluidas en la app)."}
            </Text>
            <Pressable
              style={[styles.secondaryButton, { marginTop: 10 }, updatingQuestions && styles.disabledButton]}
              onPress={onRefreshQuestions}
              disabled={updatingQuestions}
            >
              {updatingQuestions ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color="#1b4965" />
                  <Text style={styles.secondaryButtonText}>Actualizando...</Text>
                </View>
              ) : (
                <Text style={styles.secondaryButtonText}>🔄 Actualizar preguntas</Text>
              )}
            </Pressable>
            <Text style={[styles.cardDescription, { marginTop: 6 }]}>
              Se comprueba automáticamente una vez al día.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
