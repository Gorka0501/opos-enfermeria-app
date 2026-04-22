import { Alert, Linking, Platform } from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "./nativeFileSystem";
import * as IntentLauncher from "expo-intent-launcher";

export async function openPdfUri(uri: string): Promise<void> {
  if (Platform.OS === "web") {
    await Linking.openURL(uri);
    return;
  }

  if (Platform.OS === "ios") {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Guardar PDF" });
    return;
  }

  // Android: convertir file:// a content:// y abrir con visor nativo
  try {
    const contentUri = await FileSystem.getContentUriAsync(uri);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      flags: 1,
      type: "application/pdf",
    });
  } catch (e) {
    Alert.alert("Error abriendo PDF", String(e));
  }
}
