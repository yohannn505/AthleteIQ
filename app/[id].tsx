import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from '../firebaseConfig';
import { predictInjuryRisk } from "../utils/injuryModel";

export default function SportDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  
  const [manualDuration, setManualDuration] = useState('');
  const [manualHR, setManualHR] = useState('');
  const [intensity, setIntensity] = useState(5); 

  const displayName = typeof id === 'string' ? id.charAt(0).toUpperCase() + id.slice(1) : 'Activity';

  useEffect(() => {
    fetchSessions();
  }, [id]);

  const fetchSessions = async () => {
    try {
      const q = query(
        collection(db, "sessions"), 
        where("sportId", "==", id),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      setSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.log("Fetch error (likely no index yet):", e);
    }
  };

  const saveSession = async (type: 'manual' | 'watch') => {
    try {
      const duration = type === 'watch' ? 45 : parseInt(manualDuration);
      const hr = type === 'watch' ? 142 : parseInt(manualHR);

      if (!duration || isNaN(duration)) {
        Alert.alert("Error", "Please enter a valid duration");
        return;
      }

      await addDoc(collection(db, "sessions"), {
        sportId: id,
        duration: duration,
        avgHeartRate: hr || 0,
        intensity: intensity,
        source: type,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || 'guest'
      });

      Alert.alert("Success", type === 'watch' ? "Watch Data Synced!" : "Session Logged!");
      setShowLogModal(false);
      setManualDuration('');
      setManualHR('');
      fetchSessions();
    } catch (e) {
      Alert.alert("Error", "Could not save session.");
    }
  };

  // Injury calculation
  const recentLoad = sessions.slice(0, 7).map(s => s.duration);
  const chronicLoad = [60, 50, 70, 60, 55, 60, 65]; 
  const { risk } = predictInjuryRisk(recentLoad, chronicLoad, 7, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={28} color="#22d3ee" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Risk Card */}
        <View style={[styles.riskCard, { borderColor: risk === 'High' ? '#ef4444' : '#10b981' }]}>
          <Text style={styles.riskLabel}>{displayName.toUpperCase()} INJURY RISK</Text>
          <Text style={[styles.riskValue, { color: risk === 'High' ? '#ef4444' : '#10b981' }]}>{risk}</Text>
        </View>

        <TouchableOpacity style={styles.mainActionBtn} onPress={() => setShowLogModal(true)}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.mainActionBtnText}>Record Activity</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent History</Text>
        {sessions.map((s) => (
          <View key={s.id} style={styles.historyCard}>
            <View>
              <Text style={styles.historyText}>{s.duration} min • {s.avgHeartRate} BPM</Text>
              <Text style={styles.historySource}>Source: {s.source || 'Manual'}</Text>
            </View>
            <Ionicons name={s.source === 'watch' ? "watch" : "create"} size={20} color="#475569" />
          </View>
        ))}
      </ScrollView>

      {/* LOGGING MODAL */}
      <Modal visible={showLogModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record {displayName}</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.watchSyncBox} onPress={() => saveSession('watch')}>
              <Ionicons name="watch" size={32} color="#22d3ee" />
              <View>
                <Text style={styles.watchSyncTitle}>Sync from Apple Watch</Text>
                <Text style={styles.watchSyncSub}>Import last detected workout</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>Duration (minutes)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 60" 
              placeholderTextColor="#475569"
              keyboardType="numeric"
              value={manualDuration}
              onChangeText={setManualDuration}
            />

            <Text style={styles.inputLabel}>Avg Heart Rate (optional)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 145" 
              placeholderTextColor="#475569"
              keyboardType="numeric"
              value={manualHR}
              onChangeText={setManualHR}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={() => saveSession('manual')}>
              <Text style={styles.saveBtnText}>Save Manual Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { paddingTop: 60, padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginLeft: 16 },
  scrollContent: { padding: 20 },
  riskCard: { padding: 20, borderRadius: 20, borderWidth: 2, alignItems: 'center', marginBottom: 20, backgroundColor: '#0f172a' },
  riskLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  riskValue: { fontSize: 36, fontWeight: 'bold' },
  mainActionBtn: { backgroundColor: '#0891b2', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 30 },
  mainActionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  historyCard: { backgroundColor: '#0f172a', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  historyText: { color: 'white', fontWeight: '500', fontSize: 16 },
  historySource: { color: '#64748b', fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f172a', padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  watchSyncBox: { flexDirection: 'row', gap: 15, alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#22d3ee' },
  watchSyncTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  watchSyncSub: { color: '#94a3b8', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 20 },
  inputLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, color: 'white', marginBottom: 15 },
  saveBtn: { backgroundColor: '#22d3ee', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#020617', fontWeight: 'bold', fontSize: 16 }
});
