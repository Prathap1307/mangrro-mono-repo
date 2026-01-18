import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CompleteProfileScreen() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          We need a few details before you can continue.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Email"
          editable={false}
          value="user@example.com"
          style={[styles.input, styles.disabledInput]}
        />

        <Text style={styles.label}>Full name</Text>
        <TextInput
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
        />

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save &amp; continue</Text>
        </TouchableOpacity>

        <Text style={styles.todo}>
          TODO: Save profile details and mark completion.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
  },
  label: {
    fontWeight: "600",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
  },
  disabledInput: {
    backgroundColor: "#f3f4f6",
  },
  primaryButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  todo: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
  },
});
