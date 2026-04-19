import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from "../AppText";
import { styles, theme } from "../../styles/appStyles";
import { PROFILES, Profile } from "../../constants/profiles";

type ProfileSelectScreenProps = {
  onSelectProfile: (profileId: Profile["id"]) => void;
};

export function ProfileSelectScreen({ onSelectProfile }: ProfileSelectScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Oposiciones Sanitarias</Text>
        <Text style={styles.subtitle}>
          Elige la categoría de tu oposición para cargar el banco de preguntas correspondiente.
        </Text>

        {PROFILES.map((profile) => (
          <Pressable
            key={profile.id}
            style={({ pressed }) => [
              styles.card,
              {
                borderWidth: 2,
                borderColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => onSelectProfile(profile.id)}
          >
            <Text style={[styles.cardTitle, { fontSize: 22 }]}>
              {profile.emoji}{"  "}{profile.label}
            </Text>
            <Text style={styles.cardDescription}>{profile.description}</Text>
            <View style={{ marginTop: 10, gap: 4 }}>
              <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                📚 {profile.commonLabel}
              </Text>
              <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
                🎯 {profile.specificLabel}
              </Text>
            </View>
            <Pressable
              style={[styles.primaryButton, { marginTop: 14 }]}
              onPress={() => onSelectProfile(profile.id)}
            >
              <Text style={styles.primaryButtonText}>Seleccionar</Text>
            </Pressable>
          </Pressable>
        ))}

        <Text style={[styles.cardDescription, { textAlign: "center", color: theme.textMuted }]}>
          Podrás cambiar la categoría en cualquier momento desde las opciones.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
