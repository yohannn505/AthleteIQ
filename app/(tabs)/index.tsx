import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart } from "react-native-chart-kit";
import { auth, db } from '../../firebaseConfig';

interface Activity {
  id: string;
  name: string;
  icon: string;
  color: string;
  sessions: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  
  // Analytics State
  const [globalRisk, setGlobalRisk] = useState("Low");
  const [chartData, setChartData] = useState([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid || 'guest';
      
      // 1. Fetch Activities
      const qAct = query(
        collection(db, "activities"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const actSnap = await getDocs(qAct);
      const loadedActs = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Activity[];
      setActivities(loadedActs);

      // 2. Fetch Sessions for Chart and Risk
      const qSessions = query(
        collection(db, "sessions"),
        where("userId", "==", userId)
      );
      const sessionSnap = await getDocs(qSessions);
      
      let totalDuration = 0;
      const weeklyTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

      sessionSnap.docs.forEach(doc => {
        const data = doc.data();
        totalDuration += data.duration || 0;

        // Grouping for Chart
        const sessionDate = data.timestamp?.toDate();
        if (sessionDate) {
          const day = sessionDate.getDay(); 
          const index = day === 0 ? 6 : day - 1; // Adjust to Mon-Sun
          weeklyTotals[index] += data.duration || 0;
        }
      });

      setChartData(weeklyTotals);
      
      // Risk Logic
      if (totalDuration > 500) setGlobalRisk("High");
      else if (totalDuration > 200) setGlobalRisk("Medium");
      else setGlobalRisk("Low");

    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async (activity: Partial<Activity>) => {
    try {
      const activityData = {
        name: activity.name || 'New Activity',
        icon: activity.icon || 'run',
        color: activity.color || '#22d3ee',
        sessions: 0,
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'guest',
      };
      const docRef = await addDoc(collection(db, "activities"), activityData);
      setActivities([{ id: docRef.id, ...activityData } as Activity, ...activities]);
      setShowAddActivity(false);
      setNewActivityName('');
    } catch (error) {
      Alert.alert("Error", "Could not save activity.");
    }
  };

  const riskColor = globalRisk === 'High' ? '#ef4444' : globalRisk === 'Medium' ? '#fbbf24' : '#10b981';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AthleteIQ</Text>
          <View style={styles.headerSubtitle}>
            <Ionicons name="sparkles" size={14} color="#22d3ee" />
            <Text style={styles.headerSubtitleText}>AI Analysis Active</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowAddActivity(true)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* READINESS CARD */}
        <View style={[styles.mainRiskCard, { borderColor: riskColor + '50' }]}>
          <View style={styles.riskHeader}>
            <Ionicons name="shield-checkmark" size={20} color={riskColor} />
            <Text style={styles.riskTitle}>OVERALL READINESS</Text>
          </View>
          <Text style={[styles.riskStatus, { color: riskColor }]}>{globalRisk} Risk</Text>
          <Text style={styles.riskDesc}>Based on training volume and load across all sports.</Text>
        </View>

        {/* CHART SECTION */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Weekly Volume (min)</Text>
          <BarChart
            data={{
              labels: ["M", "T", "W", "T", "F", "S", "S"],
              datasets: [{ data: chartData }]
            }}
            width={Dimensions.get("window").width - 48}
            height={180}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#0f172a",
              backgroundGradientFrom: "#0f172a",
              backgroundGradientTo: "#0f172a",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(34, 211, 238, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
              barPercentage: 0.6,
            }}
            style={{ borderRadius: 20, marginTop: 12, paddingRight: 40 }}
            withInnerLines={false}
          />
        </View>

        <Text style={styles.sectionTitle}>Your Activities</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#22d3ee" />
        ) : (
          activities.map((activity) => (
            <TouchableOpacity 
              key={activity.id} 
              style={styles.activityCard} 
              onPress={() => router.push(`/${activity.id}`)}
            >
              <View style={styles.activityContent}>
                <View style={[styles.activityIcon, { backgroundColor: (activity.color || '#22d3ee') + '20' }]}>
                  <MaterialCommunityIcons name={(activity.icon || 'run') as any} size={28} color={activity.color} />
                </View>
                <View>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityStats}>View specialized analytics</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FLOATING COACH BUTTON */}
      <TouchableOpacity 
        style={styles.floatingCoachBtn} 
        onPress={() => router.push('/coach')}
      >
        <Ionicons name="sparkles" size={20} color="white" />
        <Text style={styles.floatingBtnText}>Ask Coach</Text>
      </TouchableOpacity>

      {/* Modal for adding activities (kept from previous build) */}
      <Modal visible={showAddActivity} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Discipline</Text>
            <TextInput
              style={styles.input}
              placeholder="Activity Name (e.g. Soccer)"
              placeholderTextColor="#64748b"
              value={newActivityName}
              onChangeText={setNewActivityName}
            />
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={() => addActivity({ name: newActivityName })}
            >
              <Text style={styles.createButtonText}>Start Tracking</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddActivity(false)} style={{marginTop: 15, alignItems: 'center'}}>
              <Text style={{color: '#94a3b8'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { backgroundColor: '#0f172a', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  headerSubtitleText: { color: '#22d3ee', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  headerButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0891b2', justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  mainRiskCard: { backgroundColor: '#0f172a', borderRadius: 24, padding: 24, borderWidth: 1, marginBottom: 24 },
  riskHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  riskTitle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
  riskStatus: { fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  riskDesc: { color: '#64748b', fontSize: 13 },
  chartContainer: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  activityCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 },
  activityContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  activityIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activityName: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  activityStats: { color: '#64748b', fontSize: 12, marginTop: 2 },
  floatingCoachBtn: { position: 'absolute', bottom: 30, right: 24, backgroundColor: '#0891b2', paddingVertical: 14, paddingHorizontal: 22, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 8, shadowColor: '#22d3ee', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
  floatingBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#0f172a', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1e293b' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, color: 'white', marginBottom: 16 },
  createButton: { backgroundColor: '#0891b2', padding: 16, borderRadius: 12, alignItems: 'center' },
  createButtonText: { color: 'white', fontWeight: 'bold' },
});
