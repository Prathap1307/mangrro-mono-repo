import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { CategoryTile } from "../../components/CategoryTile";
import { Header } from "../../components/Header";
import { mainCategories } from "../../data/mock";

export default function Home() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <Header title="Mangro" />

      <View style={styles.grid}>
        {mainCategories.map((c) => (
          <CategoryTile
            key={c.id}
            name={c.name}
            onPress={() => router.push(`/category/${c.id}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff" },
  grid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
