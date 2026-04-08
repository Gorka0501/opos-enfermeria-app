import { Pressable } from "react-native";
import { AppText as Text } from "./AppText";
import { styles } from "../styles/appStyles";

type OptionButtonProps = {
  index: number;
  text: string;
  onPress: () => void;
  disabled?: boolean;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
};

export function OptionButton({
  index,
  text,
  onPress,
  disabled = false,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
}: OptionButtonProps) {
  return (
    <Pressable
      style={[
        styles.optionButton,
        isSelected && styles.optionButtonSelected,
        isCorrect && styles.optionCorrect,
        isWrong && styles.optionWrong,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.optionText,
          (isSelected || isCorrect || isWrong) && styles.optionTextSelected,
        ]}
      >
        {String.fromCharCode(65 + index)}. {text}
      </Text>
    </Pressable>
  );
}
