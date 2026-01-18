import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>
        Continue to access your account and orders.
      </Text>
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Continue with email</Text>
      </TouchableOpacity>
      <Text style={styles.todo}>TODO: Connect auth provider.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
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
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  todo: {
    color: "#9ca3af",
    fontSize: 12,
  },
});
