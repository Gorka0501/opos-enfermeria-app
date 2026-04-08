import { Linking, Platform } from "react-native";
import * as Sharing from "expo-sharing";

type WebOpen = (url?: string, target?: string, features?: string) => unknown;

export async function openPdfUri(uri: string): Promise<void> {
  const webOpen = (globalThis as { open?: WebOpen }).open;
  if (Platform.OS === "web" && typeof webOpen === "function") {
    webOpen(uri, "_blank", "noopener,noreferrer");
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(uri);
    if (canOpen) {
      await Linking.openURL(uri);
      return;
    }
  } catch {
    // Fall through to sharing fallback below.
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Abrir PDF",
    });
    return;
  }

  throw new Error("No available handler for PDF URI");
}