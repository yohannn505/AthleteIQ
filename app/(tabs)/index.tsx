import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { auth, db } from '../../firebaseConfig';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [calories, setCalories] = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [chartData, setChartData] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]); 

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    const userId = auth.currentUser?.uid || "VIDEO_DEMO_USER";
    
    try {
      const q = query(
        collection(db, "activities"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setRecentActivities(activities);

      const totalCals = activities.reduce((sum: any, act: any) => sum + (act.calories || 0), 0);
      setCalories(totalCals);
      setWorkoutCount(activities.length);

      // Risk Logic
      let currentRisk: 'Low' | 'Medium' | 'High' = 'Low';
      if (totalCals > 2000) currentRisk = 'High';
      else if (totalCals > 800) currentRisk = 'Medium';
      setRiskLevel(currentRisk);

      // Chart Logic
      if (activities.length > 0) {
        const recentActivity = activities.slice(0, 6).reverse(); 
        const dataPoints = recentActivity.map((a: any) => a.intensity || 0);
        while (dataPoints.length < 6) dataPoints.unshift(0);
        setChartData(dataPoints);
      } else {
        setChartData([0, 0, 0, 0, 0, 0]);
      }

    } catch (e) {
      console.log("Error fetching dashboard:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getRiskColor = () => {
    if (riskLevel === 'High') return '#ef4444';
    if (riskLevel === 'Medium') return '#f59e0b';
    return '#22d3ee';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>Athlete</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/modal')} style={styles.addBtn}>
          <Ionicons name="add" size={28} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22d3ee" />}
      >
        {/* Risk Card */}
        <View style={[styles.card, { borderColor: getRiskColor() }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="pulse" size={24} color={getRiskColor()} />
            <Text style={[styles.cardTitle, { color: getRiskColor() }]}>INJURY RISK</Text>
          </View>
          <Text style={styles.riskValue}>{riskLevel}</Text>
          <Text style={styles.riskSubtitle}>{riskLevel === 'High' ? 'Training load spike detected.' : 'Training load is optimized.'}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.row}>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>CALORIES</Text><Text style={styles.metricValue}>{calories}</Text></View>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>WORKOUTS</Text><Text style={styles.metricValue}>{workoutCount}</Text></View>
        </View>

        {/* Chart */}
        <Text style={styles.sectionTitle}>INTENSITY TREND</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={{ labels: ["", "", "", "", "", ""], datasets: [{ data: chartData }] }}
            width={Dimensions.get("window").width - 48} height={220}
            yAxisLabel="" yAxisSuffix=""
            chartConfig={{
              backgroundColor: "#0f172a", backgroundGradientFrom: "#0f172a", backgroundGradientTo: "#0f172a", decimalPlaces: 0,
              color: (opacity = 1) => `rgba(34, 211, 238, ${opacity})`, labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
              style: { borderRadius: 16 }, propsForDots: { r: "6", strokeWidth: "2", stroke: "#0f172a" }
            }}
            bezier style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        {/* RESTORED: Recent Activities List */}
        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        {recentActivities.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="barbell" size={20} color="white" />
              </View>
              <View>
                <Text style={styles.activityName}>{activity.name}</Text>
                <Text style={styles.activitySub}>{activity.duration} min • {activity.calories} cal</Text>
              </View>
            </View>
            <View style={styles.activityRight}>
               {activity.heartRate > 0 && (
                 <View style={styles.tag}>
                   <Ionicons name="heart" size={10} color="#ef4444" />
                   <Text style={styles.tagText}>{activity.heartRate}</Text>
                 </View>
               )}
            </View>
          </View>
        ))}

      </ScrollView>

      {/* RESTORED: The Floating Chat Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/coach')}>
        <Ionicons name="chatbubble-ellipses" size={28} color="#0f172a" />
        <Text style={styles.fabText}>Ask Coach</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  greeting: { color: '#94a3b8', fontSize: 16 },
  username: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#22d3ee', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { backgroundColor: '#1e293b', padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  riskValue: { color: 'white', fontSize: 42, fontWeight: 'bold' },
  riskSubtitle: { color: '#94a3b8', marginTop: 5 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 30 },
  metricCard: { flex: 1, backgroundColor: '#0f172a', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', alignItems: 'center' },
  metricLabel: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  metricValue: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  chartContainer: { alignItems: 'center', marginBottom: 20 },
  
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 16, marginBottom: 12 },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  activityName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  activitySub: { color: '#94a3b8', fontSize: 12 },
  activityRight: { alignItems: 'flex-end' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },

  fab: { position: 'absolute', bottom: 30, right: 24, backgroundColor: '#22d3ee', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5, shadowColor: '#22d3ee', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabText: { color: '#0f172a', fontWeight: 'bold', fontSize: 16 },
});
