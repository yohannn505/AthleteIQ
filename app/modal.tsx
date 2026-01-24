import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function ModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params; 
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      const fetchActivity = async () => {
        try {
          const docRef = doc(db, "activities", id as string);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name);
            setDuration(data.duration ? data.duration.toString() : '');
            if (data.heartRate) setHeartRate(data.heartRate.toString());
            setIntensity(data.intensity || 5);
          }
        } catch (e) { console.log(e); } finally { setInitialLoading(false); }
      };
      fetchActivity();
    }
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Info", "Please enter a workout name.");
      return;
    }
    
    const durationNum = parseInt(duration) || 0;
    const heartRateNum = parseInt(heartRate) || 0;

    if (durationNum <= 0) {
      Alert.alert("Invalid Input", "Duration must be a number greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser?.uid || "VIDEO_DEMO_USER";

      let estimatedCalories = 0;
      if (heartRateNum > 0) {
        estimatedCalories = Math.round(durationNum * (heartRateNum - 60) * 0.18);
        if (estimatedCalories < 0) estimatedCalories = durationNum * 4; 
      } else {
        const estimatedMET = 3 + (intensity / 10) * 9; 
        estimatedCalories = Math.round(estimatedMET * durationNum * 1.1); 
      }

      const activityData = {
        name: name.trim(),
        duration: durationNum,
        heartRate: heartRateNum,
        intensity: intensity,
        calories: estimatedCalories,
        userId: userId, 
        updatedAt: new Date(),
      };

      if (isEditing) {
        await updateDoc(doc(db, "activities", id as string), activityData);
      } else {
        await addDoc(collection(db, "activities"), { ...activityData, createdAt: new Date() });
      }
      
      router.back();
      
    } catch (error: any) { 
      console.error("Save Error:", error);
      Alert.alert("Save Failed", error.message);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.customHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#22d3ee" />
              <Text style={styles.headerBackText}>User</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {initialLoading ? (
          <ActivityIndicator size="large" color="#22d3ee" style={{ marginTop: 50 }} />
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.title}>{isEditing ? 'Edit Workout' : 'Log Workout'}</Text>
              <View style={styles.form}>
                <Text style={styles.label}>Workout Name</Text>
                <TextInput style={styles.input} placeholder="e.g. Heavy Deadlifts" placeholderTextColor="#64748b" value={name} onChangeText={setName} returnKeyType="done" />
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}><Text style={styles.label}>Duration (min)</Text><TextInput style={styles.input} placeholder="45" placeholderTextColor="#64748b" value={duration} onChangeText={setDuration} keyboardType="numeric" returnKeyType="done" /></View>
                  <View style={{ flex: 1 }}><Text style={styles.label}>Avg Heart Rate</Text><TextInput style={styles.input} placeholder="145" placeholderTextColor="#64748b" value={heartRate} onChangeText={setHeartRate} keyboardType="numeric" returnKeyType="done" /></View>
                </View>
                <View style={styles.rowLabel}><Text style={styles.label}>Intensity (RPE)</Text><Text style={[styles.value, { color: intensity > 7 ? '#ef4444' : '#22d3ee' }]}>{intensity} / 10</Text></View>
                <Slider style={{ width: '100%', height: 40 }} minimumValue={1} maximumValue={10} step={1} minimumTrackTintColor={intensity > 7 ? '#ef4444' : '#22d3ee'} maximumTrackTintColor="#334155" thumbTintColor="white" value={intensity} onValueChange={setIntensity} />
                <Text style={styles.helperText}>1 = Resting, 10 = Max Effort</Text>
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.saveText}>{isEditing ? 'Update Workout' : 'Save Workout'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  safeArea: { backgroundColor: '#020617' },
  customHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, marginTop: Platform.OS === 'android' ? 40 : 0 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerBackText: { color: '#22d3ee', fontSize: 18, fontWeight: '500' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 30 },
  form: { gap: 20 },
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  rowLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowInputs: { flexDirection: 'row', gap: 15 }, 
  value: { fontSize: 18, fontWeight: 'bold' },
  input: { backgroundColor: '#1e293b', color: 'white', padding: 18, borderRadius: 12, fontSize: 18, borderWidth: 1, borderColor: '#334155' },
  helperText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: -10 },
  saveBtn: { backgroundColor: '#22d3ee', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  saveText: { color: '#0f172a', fontWeight: 'bold', fontSize: 16 },
});
