import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f9ff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f9ff",
  },
  content: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1b4965",
  },
  subtitle: {
    fontSize: 16,
    color: "#3d5a6c",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d6e6f2",
  },
  cardTitle: {
    color: "#3d5a6c",
    fontSize: 14,
    fontWeight: "600",
  },
  cardNumber: {
    color: "#102a43",
    fontSize: 22,
    fontWeight: "800",
    marginVertical: 4,
  },
  cardDescription: {
    color: "#57788f",
    fontSize: 13,
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#bcd2e8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#102a43",
    backgroundColor: "#ffffff",
  },
  progress: {
    color: "#57788f",
    fontWeight: "700",
  },
  question: {
    fontSize: 22,
    color: "#102a43",
    fontWeight: "700",
    lineHeight: 30,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bcd2e8",
  },
  optionButtonSelected: {
    backgroundColor: "#1b4965",
    borderColor: "#1b4965",
  },
  optionCorrect: {
    backgroundColor: "#198754",
    borderColor: "#198754",
  },
  optionWrong: {
    backgroundColor: "#bb3e03",
    borderColor: "#bb3e03",
  },
  optionText: {
    color: "#1f2933",
    fontSize: 16,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#0a9396",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0a9396",
  },
  secondaryButtonText: {
    color: "#0a9396",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.45,
  },
  score: {
    fontSize: 42,
    fontWeight: "800",
    color: "#1b4965",
    marginBottom: 8,
  },
  feedbackBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d6e6f2",
    padding: 14,
    gap: 6,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#102a43",
  },
  feedbackText: {
    color: "#3d5a6c",
    lineHeight: 20,
  },
  info: {
    marginTop: 12,
    color: "#3d5a6c",
  },
});
