import { createContext, useContext } from "react";

export const FontScaleContext = createContext<number>(1);

export function useFontScale(): number {
  return useContext(FontScaleContext);
}
