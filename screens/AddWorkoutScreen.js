import { useNavigation } from '@react-navigation/native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function AddWorkoutScreen() {
  const navigation = useNavigation();
  const [athleteName, setAthleteName] = useState('');
  const [intensity, setIntensity] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveWorkout = async () => {
    if (!athleteName || !intensity || !duration) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const estimatedCalories = Math.round(Number(duration) * (Number(intensity) * 1.2));

      await addDoc(collection(db, "activities"), {
        athleteName: athleteName,
        intensity: Number(intensity),
        duration: Number(duration),
        calories: estimatedCalories, 
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'guest', 
      });
      
      Alert.alert("Success", `Workout Saved! Est. Burn: ${estimatedCalories} cal`, [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error adding document: ", error);
      Alert.alert("Error", "Could not save workout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Activity Name</Text>
        <TextInput 
          style={styles.input} 
          value={athleteName} 
          onChangeText={setAthleteName} 
          placeholder="e.g. Running, lifting..."
        />

        <Text style={styles.label}>Intensity (1-10)</Text>
        <TextInput 
          style={styles.input} 
          value={intensity} 
          onChangeText={setIntensity} 
          keyboardType="numeric"
          placeholder="Rate the effort"
        />

        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput 
          style={styles.input} 
          value={duration} 
          onChangeText={setDuration} 
          keyboardType="numeric"
          placeholder="Total training time"
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSaveWorkout}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Saving..." : "Save Workout"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { 
    backgroundColor: '#F2F2F7', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 20,
    fontSize: 16
  },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10
  },
  buttonDisabled: { backgroundColor: '#A2CFFE' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
