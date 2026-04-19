import { Linking, Platform } from "react-native";
import * as Sharing from "expo-sharing";

export async function openPdfUri(uri: string): Promise<void> {
  if (Platform.OS === "web") {
    await Linking.openURL(uri);
    return;
  }

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
  } else {
    await Linking.openURL(uri);
  }
}
