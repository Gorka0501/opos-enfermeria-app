/**
 * Wrapper sobre expo-file-system/legacy para acceder a getContentUriAsync en Android.
 * Requiere unstable_enablePackageExports = true en metro.config.js
 */
// @ts-ignore – expo-file-system solo expone el subpath /legacy en su campo exports
import * as EFS from "expo-file-system/legacy";

export async function getContentUriAsync(fileUri: string): Promise<string> {
  return EFS.getContentUriAsync(fileUri);
}
