import { StyleSheet, Text, TextInput, View } from "react-native";

export default function Search() {
  return (
    <View style={styles.container}>
      <TextInput placeholder="Search items..." style={styles.input} />
      <Text>Results will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 40 },
  input: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
});
