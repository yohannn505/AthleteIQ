import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../firebaseConfig'; // This assumes the file is now inside the 'app' folder

export default function CoachScreen() {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAdvice = async () => {
      try {
        const q = query(collection(db, "sessions"), where("userId", "==", auth.currentUser?.uid || 'guest'));
        const snap = await getDocs(q);
        const total = snap.docs.reduce((acc, doc) => acc + (doc.data().duration || 0), 0);
        
        // Dynamic logic for the AI feel
        if (total > 300) {
          setAdvice("High training load detected (" + total + " mins). Your risk of overuse injury is elevated. Focus on sleep and hydration today.");
        } else {
          setAdvice("Your training load is optimal. You are cleared for high-intensity work today.");
        }
        setLoading(false);
      } catch (e) {
        setAdvice("Coach is currently offline. Please log a workout first.");
        setLoading(false);
      }
    };
    getAdvice();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={32} color="#22d3ee" />
        <Text style={styles.title}>Coach AI</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#22d3ee" />
      ) : (
        <View style={styles.aiCard}>
          <Text style={styles.text}>{advice}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 24 },
  header: { marginTop: 60, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 30 },
  title: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  aiCard: { backgroundColor: '#0f172a', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#22d3ee' },
  text: { color: 'white', fontSize: 18, lineHeight: 28 },
});
