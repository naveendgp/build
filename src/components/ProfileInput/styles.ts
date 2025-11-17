import { StyleSheet } from "react-native";
import { COLORS, FONTFAMILY } from "../../constants";

export default StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    color: COLORS.INPUT_TEXT,
    fontWeight: "500",
    marginBottom: 8,
  },
  asterisk: {
    color: COLORS.ERROR,
  },
  inputRow: {
    width: "100%",
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER_INPUT,
    height:40
  },
  inputRowDisabled: {
    opacity: 0.6,
  },
  input: {
    fontSize: 16,
    fontFamily: FONTFAMILY.INTER_MEDIUM,
    fontWeight: "500",
    color: COLORS.INPUT_TEXT,
    padding: 0,
  },
});

