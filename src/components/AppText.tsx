import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { useFontScale } from "../context/FontScaleContext";

/**
 * Drop-in replacement for RN Text that automatically scales
 * fontSize and lineHeight by the global fontScale setting.
 */
export function AppText({ style, ...props }: TextProps) {
  const scale = useFontScale();

  const scaledStyle = React.useMemo(() => {
    if (scale === 1) return style;
    const flat = StyleSheet.flatten(style) ?? {};
    const result: Record<string, unknown> = { ...flat };
    if (flat.fontSize != null) result.fontSize = (flat.fontSize as number) * scale;
    if (flat.lineHeight != null) result.lineHeight = (flat.lineHeight as number) * scale;
    return result as TextProps["style"];
  }, [style, scale]);

  return <Text style={scaledStyle} {...props} />;
}
