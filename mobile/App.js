import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const plan = [
  { title: "Business Foundations", topics: ["Business models", "Startups and MVPs", "Economics basics", "Accounting", "Corporate finance"] },
  { title: "Marketing Mastery", topics: ["Consumer psychology", "Digital marketing", "Sales", "Brand building"] },
  { title: "Strategy & Decision Making", topics: ["SWOT", "Porter's Five Forces", "Market entry", "Risk analysis"] },
  { title: "Operations & Systems", topics: ["Supply chain", "Lean systems", "Process optimization", "SOP creation"] },
  { title: "Leadership & Communication", topics: ["Public speaking", "Team management", "Negotiation", "Presentations"] },
  { title: "Entrepreneurship", topics: ["Startup ideation", "MVP validation", "Fundraising", "Pitch decks"] },
  { title: "Analytics & Data", topics: ["Advanced Excel", "SQL", "Dashboards", "KPIs", "A/B testing"] },
  { title: "Product Management", topics: ["Lifecycle", "Research", "Wireframes", "Roadmaps", "PRDs"] },
  { title: "AI, Tech & Business", topics: ["AI models", "SaaS economics", "Agents", "API economy"] },
  { title: "Real MBA Case Studies", topics: ["Finance", "Marketing", "Startup", "Product", "Operations cases"] },
  { title: "Real-World Execution", topics: ["Build a startup, SaaS product, AI tool, agency, or consulting service"] },
  { title: "Executive-Level Thinking", topics: ["Global markets", "Leadership psychology", "Hiring", "Vision and culture"] }
];

const sources = [
  "The Economist",
  "Mint",
  "Business Standard",
  "Harvard Business Review",
  "McKinsey Insights",
  "Y Combinator Essays",
  "Paul Graham Essays",
  "TechCrunch",
  "Stratechery"
];

function getApiUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(":")?.[0];
  if (host) return `http://${host}:3000`;

  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const apiUrl = useMemo(getApiUrl, []);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    month: "1",
    week: "1",
    focus: plan[0].title,
    source: sources[0],
    minutes: "120",
    completed: false,
    notes: ""
  });

  const selectedPlan = plan[Number(form.month) - 1] || plan[0];
  const totalMinutes = entries.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);
  const completedCount = entries.filter((entry) => entry.completed).length;

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const loadEntries = useCallback(async () => {
    const response = await fetch(`${apiUrl}/api/entries`);
    if (!response.ok) throw new Error("Could not load entries");
    const data = await response.json();
    setEntries(data);
  }, [apiUrl]);

  useEffect(() => {
    loadEntries()
      .catch((error) => Alert.alert("Connection issue", `${error.message}\n\nAPI: ${apiUrl}`))
      .finally(() => setLoading(false));
  }, [apiUrl, loadEntries]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadEntries();
    } catch (error) {
      Alert.alert("Refresh failed", error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const saveEntry = async () => {
    if (!form.focus.trim()) {
      Alert.alert("Focus is required", "Add the learning topic before saving.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/api/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, minutes: Number(form.minutes || 0) })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Could not save entry");
      }

      setForm((current) => ({ ...current, date: today(), notes: "", completed: false }));
      await loadEntries();
    } catch (error) {
      Alert.alert("Save failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEntry = async (entry) => {
    await fetch(`${apiUrl}/api/entries/${entry._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !entry.completed })
    });
    await loadEntries();
  };

  const deleteEntry = async (entry) => {
    await fetch(`${apiUrl}/api/entries/${entry._id}`, { method: "DELETE" });
    await loadEntries();
  };

  const selectMonth = (month) => {
    const nextPlan = plan[month - 1];
    setForm((current) => ({ ...current, month: String(month), focus: nextPlan.title }));
  };

  const renderEntry = ({ item }) => (
    <View style={styles.entry}>
      <View style={styles.entryTitleRow}>
        <Text style={styles.entryTitle}>{item.focus}</Text>
        <Text style={[styles.status, item.completed && styles.statusDone]}>
          {item.completed ? "Done" : "Open"}
        </Text>
      </View>
      <Text style={styles.entryNotes}>{item.notes || "No notes added."}</Text>
      <Text style={styles.meta}>
        {item.date}  |  Month {item.month}, Week {item.week}  |  {Math.round((item.minutes / 60) * 10) / 10} hrs
      </Text>
      <View style={styles.actions}>
        <Pressable style={styles.smallButton} onPress={() => toggleEntry(item)}>
          <Ionicons name={item.completed ? "return-up-back" : "checkmark"} size={16} color="#0f766e" />
          <Text style={styles.smallButtonText}>{item.completed ? "Undo" : "Mark done"}</Text>
        </Pressable>
        <Pressable style={[styles.smallButton, styles.deleteButton]} onPress={() => deleteEntry(item)}>
          <Ionicons name="trash-outline" size={16} color="#9f1239" />
          <Text style={[styles.smallButtonText, styles.deleteText]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          data={entries}
          keyExtractor={(item) => item._id}
          renderItem={renderEntry}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListHeaderComponent={
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.header}>
              <Text style={styles.eyebrow}>12-Month Plan</Text>
              <Text style={styles.title}>Self-MBA Tracker</Text>
              <Text style={styles.subtitle}>Log daily reading, main learning, practice, and revision from the PDF plan.</Text>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{entries.length}</Text>
                  <Text style={styles.statLabel}>Entries</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{Math.round((totalMinutes / 60) * 10) / 10}</Text>
                  <Text style={styles.statLabel}>Hours</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{completedCount}</Text>
                  <Text style={styles.statLabel}>Done</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Add learning entry</Text>
                <TextInput style={styles.input} value={form.date} onChangeText={(value) => updateForm("date", value)} placeholder="YYYY-MM-DD" />

                <Text style={styles.label}>Month</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {plan.map((month, index) => (
                    <Pressable
                      key={month.title}
                      style={[styles.chip, form.month === String(index + 1) && styles.chipActive]}
                      onPress={() => selectMonth(index + 1)}
                    >
                      <Text style={[styles.chipText, form.month === String(index + 1) && styles.chipTextActive]}>{index + 1}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.label}>Week</Text>
                <View style={styles.segment}>
                  {[1, 2, 3, 4].map((week) => (
                    <Pressable
                      key={week}
                      style={[styles.segmentItem, form.week === String(week) && styles.segmentActive]}
                      onPress={() => updateForm("week", String(week))}
                    >
                      <Text style={[styles.segmentText, form.week === String(week) && styles.segmentTextActive]}>W{week}</Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput style={styles.input} value={form.focus} onChangeText={(value) => updateForm("focus", value)} placeholder="Main learning topic" />
                <TextInput
                  style={styles.input}
                  value={form.source}
                  onChangeText={(value) => updateForm("source", value)}
                  placeholder="Reading source"
                />
                <TextInput
                  style={styles.input}
                  value={form.minutes}
                  onChangeText={(value) => updateForm("minutes", value.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  placeholder="Minutes"
                />
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Completed today</Text>
                  <Switch value={form.completed} onValueChange={(value) => updateForm("completed", value)} />
                </View>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={form.notes}
                  onChangeText={(value) => updateForm("notes", value)}
                  placeholder="Notes, case insight, or project progress"
                  multiline
                />
                <Pressable style={styles.button} onPress={saveEntry} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save entry</Text>}
                </Pressable>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Month {form.month}: {selectedPlan.title}</Text>
                {selectedPlan.topics.map((topic) => (
                  <Text key={topic} style={styles.topic}>- {topic}</Text>
                ))}
              </View>

              <View style={styles.listTitleRow}>
                <Text style={styles.cardTitle}>Saved entries</Text>
                {loading && <ActivityIndicator color="#0f766e" />}
              </View>
            </ScrollView>
          }
          ListEmptyComponent={!loading ? <Text style={styles.empty}>No saved entries yet.</Text> : null}
          contentContainerStyle={styles.listContent}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f6f8"
  },
  keyboard: {
    flex: 1
  },
  listContent: {
    paddingBottom: 28
  },
  header: {
    padding: 18,
    gap: 14
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: "#17202a",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 42
  },
  subtitle: {
    color: "#637083",
    fontSize: 15,
    lineHeight: 22
  },
  stats: {
    flexDirection: "row",
    gap: 10
  },
  stat: {
    flex: 1,
    backgroundColor: "#fff",
    borderColor: "#d9e0e8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12
  },
  statValue: {
    color: "#17202a",
    fontSize: 24,
    fontWeight: "900"
  },
  statLabel: {
    color: "#637083",
    fontSize: 12,
    marginTop: 2
  },
  card: {
    backgroundColor: "#fff",
    borderColor: "#d9e0e8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12
  },
  cardTitle: {
    color: "#17202a",
    fontSize: 19,
    fontWeight: "850"
  },
  label: {
    color: "#637083",
    fontSize: 13,
    fontWeight: "800"
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#d9e0e8",
    borderRadius: 8,
    borderWidth: 1,
    color: "#17202a",
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12
  },
  notesInput: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  chips: {
    gap: 8
  },
  chip: {
    alignItems: "center",
    borderColor: "#d9e0e8",
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  chipActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e"
  },
  chipText: {
    color: "#637083",
    fontWeight: "850"
  },
  chipTextActive: {
    color: "#fff"
  },
  segment: {
    flexDirection: "row",
    gap: 8
  },
  segmentItem: {
    alignItems: "center",
    borderColor: "#d9e0e8",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10
  },
  segmentActive: {
    backgroundColor: "#e7f3f1",
    borderColor: "#0f766e"
  },
  segmentText: {
    color: "#637083",
    fontWeight: "850"
  },
  segmentTextActive: {
    color: "#0b5f59"
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  switchLabel: {
    color: "#17202a",
    fontSize: 15,
    fontWeight: "700"
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0f766e",
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center"
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "850"
  },
  topic: {
    color: "#637083",
    fontSize: 15,
    lineHeight: 22
  },
  listTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2
  },
  entry: {
    backgroundColor: "#fff",
    borderColor: "#d9e0e8",
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 16
  },
  entryTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  entryTitle: {
    color: "#17202a",
    flex: 1,
    fontSize: 17,
    fontWeight: "850"
  },
  status: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    color: "#637083",
    fontSize: 12,
    fontWeight: "850",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  statusDone: {
    backgroundColor: "#dff3ed",
    color: "#0f766e"
  },
  entryNotes: {
    color: "#637083",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8
  },
  meta: {
    color: "#7b8794",
    fontSize: 12,
    marginTop: 10
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  smallButton: {
    alignItems: "center",
    backgroundColor: "#e7f3f1",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  smallButtonText: {
    color: "#0b5f59",
    fontWeight: "800"
  },
  deleteButton: {
    backgroundColor: "#f3e8e8"
  },
  deleteText: {
    color: "#9f1239"
  },
  empty: {
    color: "#637083",
    marginHorizontal: 18
  }
});
