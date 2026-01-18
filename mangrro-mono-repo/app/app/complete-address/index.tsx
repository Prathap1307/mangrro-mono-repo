import { StyleSheet, Text, View } from "react-native";

export default function CompleteAddressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Address</Text>
      <Text style={styles.subtitle}>
        This placeholder screen mirrors the web route structure.
      </Text>
      <Text style={styles.todo}>TODO: Add address completion flow.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6b7280",
    textAlign: "center",
  },
  todo: {
    color: "#9ca3af",
    fontSize: 12,
  },
});
