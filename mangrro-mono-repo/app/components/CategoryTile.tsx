import { StyleSheet, Text, TouchableOpacity } from "react-native";

export function CategoryTile({
  name,
  onPress,
}: {
  name: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.text}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#eef2ff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  text: { fontWeight: "600", textAlign: "center" },
});
