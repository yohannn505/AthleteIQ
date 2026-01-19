import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    height: '185',
    weight: '78',
    age: '24'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const userDoc = await getDoc(doc(db, "users", auth.currentUser?.uid || "guest"));
    if (userDoc.exists()) {
      setStats(userDoc.data() as any);
    }
  };

  const saveProfile = async () => {
    try {
      await setDoc(doc(db, "users", auth.currentUser?.uid || "guest"), stats);
      setIsEditing(false);
      Alert.alert("Success", "Athlete profile updated.");
    } catch (e) {
      Alert.alert("Error", "Could not save profile.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Ionicons name="person" size={50} color="#22d3ee" /></View>
        <Text style={styles.userName}>Champ User</Text>
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => isEditing ? saveProfile() : setIsEditing(true)}
        >
          <Text style={styles.editBtnText}>{isEditing ? "Save Changes" : "Edit Bio-Data"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {['height', 'weight', 'age'].map((key) => (
          <View key={key} style={styles.statCard}>
            <Text style={styles.statLabel}>{key.toUpperCase()}</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={stats[key as keyof typeof stats]}
                onChangeText={(text) => setStats({...stats, [key]: text})}
                keyboardType="numeric"
                placeholderTextColor="#475569"
              />
            ) : (
              <Text style={styles.statValue}>{stats[key as keyof typeof stats]}</Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 30, backgroundColor: '#0f172a' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#22d3ee' },
  userName: { fontSize: 26, fontWeight: 'bold', color: 'white', marginTop: 15 },
  editBtn: { marginTop: 15, backgroundColor: '#0891b2', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  editBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  statsGrid: { flexDirection: 'row', padding: 20, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#0f172a', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  statLabel: { color: '#64748b', fontSize: 10, marginBottom: 5 },
  statValue: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  input: { color: '#22d3ee', fontSize: 20, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#22d3ee', textAlign: 'center', width: '100%' }
});
