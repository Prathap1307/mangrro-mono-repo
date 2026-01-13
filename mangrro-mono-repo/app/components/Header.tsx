import { StyleSheet, Text, View } from "react-native";

export function Header({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 50, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "800" },
});
