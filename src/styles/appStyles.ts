import { Dimensions, StyleSheet } from "react-native";

const { width: WINDOW_W } = Dimensions.get("window");
// Gentle proportional scale: 1.0 at 390px (iPhone 14), capped 0.85–1.35
const WS = Math.min(Math.max(WINDOW_W / 390, 0.85), 1.35);
const sp = (n: number): number => Math.round(n * WS); // spacing
const fs = (n: number): number => Math.round(n * WS); // font size
// Max content width for tablets/web
const CONTENT_MAX = 720;

export const theme = {
  bg: "#eef3fb",
  surface: "#ffffff",
  primary: "#0f766e",
  primaryDark: "#17324d",
  textStrong: "#0f2233",
  text: "#324a5f",
  textMuted: "#62788f",
  border: "#c8d4e3",
  borderSoft: "#dbe4ef",
  success: "#1f9d63",
  danger: "#d1495b",
  warning: "#d68c00",
  answered: "#f4d35e",
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.bg,
  },
  content: {
    padding: sp(20),
    paddingBottom: sp(30),
    gap: sp(16),
    maxWidth: CONTENT_MAX,
    width: "100%",
    alignSelf: "center",
  },
  contentWithBottomBar: {
    paddingBottom: sp(130),
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: theme.borderSoft,
    backgroundColor: theme.surface,
    paddingTop: sp(10),
    paddingBottom: sp(16),
    alignItems: "center",
  },
  bottomBarInner: {
    maxWidth: CONTENT_MAX,
    width: "100%",
    paddingHorizontal: sp(20),
  },
  topHeaderRow: {
    paddingHorizontal: sp(20),
    paddingTop: sp(8),
    paddingBottom: sp(2),
    alignItems: "flex-start",
    maxWidth: CONTENT_MAX,
    width: "100%",
    alignSelf: "center",
  },
  headerHomeButton: {
    paddingHorizontal: sp(14),
    paddingVertical: sp(8),
    borderRadius: sp(12),
    borderWidth: 1,
    borderColor: theme.primaryDark,
    backgroundColor: theme.primary,
    shadowColor: theme.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  headerHomeButtonText: {
    color: theme.surface,
    fontSize: fs(14),
    fontWeight: "700",
  },
  title: {
    fontSize: fs(32),
    fontWeight: "800",
    color: theme.primaryDark,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: fs(15),
    color: theme.text,
    lineHeight: fs(21),
  },
  card: {
    backgroundColor: theme.surface,
    padding: sp(18),
    borderRadius: sp(18),
    borderWidth: 1,
    borderColor: theme.borderSoft,
    shadowColor: "#0f2233",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    color: theme.text,
    fontSize: fs(13),
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardNumber: {
    color: theme.textStrong,
    fontSize: fs(26),
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 4,
  },
  cardDescription: {
    color: theme.textMuted,
    fontSize: fs(13),
    lineHeight: fs(18),
  },
  input: {
    marginTop: sp(10),
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: sp(12),
    paddingHorizontal: sp(14),
    paddingVertical: sp(12),
    fontSize: fs(16),
    color: theme.textStrong,
    backgroundColor: theme.surface,
  },
  progress: {
    color: theme.textMuted,
    fontWeight: "700",
    fontSize: fs(13),
  },
  question: {
    fontSize: fs(21),
    color: theme.textStrong,
    fontWeight: "700",
    lineHeight: fs(29),
  },
  optionsContainer: {
    gap: sp(10),
  },
  optionButton: {
    backgroundColor: theme.surface,
    padding: sp(15),
    borderRadius: sp(14),
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionButtonSelected: {
    backgroundColor: theme.primaryDark,
    borderColor: theme.primaryDark,
  },
  optionCorrect: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  optionWrong: {
    backgroundColor: theme.danger,
    borderColor: theme.danger,
  },
  optionText: {
    color: theme.textStrong,
    fontSize: fs(16),
    lineHeight: fs(22),
  },
  optionTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: sp(8),
    backgroundColor: theme.primary,
    paddingVertical: sp(14),
    borderRadius: sp(14),
    alignItems: "center",
    shadowColor: theme.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: theme.surface,
    fontSize: fs(16),
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: "#f7fbfc",
    paddingVertical: sp(14),
    borderRadius: sp(14),
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.primary,
  },
  secondaryButtonText: {
    color: theme.primary,
    fontSize: fs(16),
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.45,
  },
  score: {
    fontSize: fs(46),
    fontWeight: "800",
    color: theme.primaryDark,
    marginBottom: 8,
  },
  feedbackBox: {
    backgroundColor: theme.surface,
    borderRadius: sp(14),
    borderWidth: 1,
    borderColor: theme.borderSoft,
    padding: sp(14),
    gap: 6,
  },
  feedbackTitle: {
    fontSize: fs(16),
    fontWeight: "800",
    color: theme.textStrong,
  },
  feedbackText: {
    color: theme.text,
    lineHeight: fs(20),
  },
  info: {
    marginTop: 12,
    color: theme.text,
  },
});
