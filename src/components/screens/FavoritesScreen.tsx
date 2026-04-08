import { Pressable, SafeAreaView, ScrollView, View } from "react-native";
import { AppText as Text } from "../AppText";
import { Question } from "../../types";
import { styles, theme } from "../../styles/appStyles";

type FavoritesScreenProps = {
  questions: Question[];
  favoriteIds: string[];
  onStartFavoritePractice: () => void;
  onGoHome: () => void;
};

export function FavoritesScreen({
  questions,
  favoriteIds,
  onStartFavoritePractice,
  onGoHome,
}: FavoritesScreenProps) {
  const favoriteQuestions = questions.filter(q => favoriteIds.includes(q.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { flex: 1, paddingBottom: 0 }]}>
        <View style={[styles.topHeaderRow, { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 2 }]}>
          <Pressable style={styles.headerHomeButton} onPress={onGoHome}>
            <Text style={styles.headerHomeButtonText}>⌂ Inicio</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>⭐ Preguntas Favoritas</Text>
        <Text style={styles.subtitle}>
          {favoriteQuestions.length} preguntas guardadas para repasar
        </Text>

        {favoriteQuestions.length === 0 ? (
          <View style={{ marginVertical: 30 }}>
            <Text style={[styles.subtitle, { textAlign: "center" }]}>
              Aún no tienes preguntas favoritas.
              {"\n"}Marca preguntas durante los exámenes para guardarlas aquí.
            </Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1, marginBottom: 15 }}>
            {favoriteQuestions.map((question, index) => (
              <View key={question.id} style={styles.card}>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: theme.primary, marginBottom: 8 }}>
                  ⭐ Pregunta {index + 1}
                </Text>
                <Text style={[styles.subtitle, { marginBottom: 8 }]}>
                  {question.question}
                </Text>
                {question.options.map((option, idx) => (
                  <Text
                    key={idx}
                    style={{
                      fontSize: 13,
                      color: idx === question.correctIndex ? theme.success : theme.textMuted,
                      fontWeight: idx === question.correctIndex ? "600" : "400",
                      marginBottom: 4,
                      marginLeft: 8,
                    }}
                  >
                    {idx === question.correctIndex && "✓ "}
                    {option}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        {favoriteQuestions.length > 0 && (
          <Pressable style={styles.primaryButton} onPress={onStartFavoritePractice}>
            <Text style={styles.primaryButtonText}>Practicar Favoritas</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
