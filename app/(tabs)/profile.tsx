import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const userEmail = auth.currentUser?.email || 'User';
  
  const [coachName, setCoachName] = useState('Mark'); 
  const [coachImage, setCoachImage] = useState('https://cdn-icons-png.flaticon.com/512/4712/4712027.png');
  const [isCoachChanged, setIsCoachChanged] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.coachName) setCoachName(data.coachName);
        if (data.coachImage) setCoachImage(data.coachImage);
      }
    } catch (error) { console.log(error); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, 
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setCoachImage(imageUri);
      setIsCoachChanged(true);
    }
  };

  const saveCoachSettings = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        coachName: coachName,
        coachImage: coachImage,
        updatedAt: new Date()
      }, { merge: true });
      
      Alert.alert("Success", "Coach Updated!");
      setIsCoachChanged(false);
    } catch (error: any) { 
      // If this alerts, tell me the error message
      Alert.alert("Save Failed", error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePasswordReset = async () => {
    if (!userEmail) return;
    try {
      await sendPasswordResetEmail(auth, userEmail);
      Alert.alert("Email Sent", "Check your inbox.");
    } catch (error: any) { Alert.alert("Error", error.message); }
  };

  const handleResetData = async () => {
    if (!auth.currentUser) return;
    Alert.alert(
      "Reset All Data?",
      "This will delete ALL your workouts.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: 'destructive',
          onPress: async () => {
            try {
              setResetLoading(true);
              const q = query(collection(db, "activities"), where("userId", "==", auth.currentUser?.uid));
              const snapshot = await getDocs(q);
              const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
              await Promise.all(deletePromises);
              Alert.alert("Done", "Workouts cleared.");
            } catch (error) { Alert.alert("Error", "Could not clear data."); } finally { setResetLoading(false); }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarLetter}>{userEmail.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <Text style={styles.userRole}>Athlete</Text>
        </View>

        <Text style={styles.sectionTitle}>CUSTOMIZE YOUR COACH</Text>
        <View style={styles.card}>
          <View style={styles.coachPreview}>
             <TouchableOpacity onPress={pickImage} style={styles.imageUploadBtn}>
               <Image source={{ uri: coachImage }} style={styles.coachAvatarLarge} />
               <View style={styles.editIconBadge}>
                 <Ionicons name="camera" size={12} color="white" />
               </View>
             </TouchableOpacity>
             <View>
               <Text style={styles.coachPreviewLabel}>Tap photo to upload</Text>
               <Text style={styles.coachPreviewName}>{coachName}</Text>
             </View>
          </View>

          <Text style={styles.inputLabel}>Coach Name</Text>
          <TextInput
            style={styles.input}
            value={coachName}
            onChangeText={(t) => { setCoachName(t); setIsCoachChanged(true); }}
            placeholder="Name your coach"
            placeholderTextColor="#64748b"
          />

          {isCoachChanged && (
            <TouchableOpacity style={styles.saveBtn} onPress={saveCoachSettings}>
              {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.saveText}>Save Changes</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* ACCOUNT & DEVELOPER SECTIONS (Kept compact for copy-paste) */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert("Syncing...", "Searching for Apple Watch...")}>
            <View style={styles.rowLeft}><Ionicons name="watch-outline" size={20} color="#22d3ee" /><Text style={styles.rowLabel}>Sync Smart Watch</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>DEVELOPER TOOLS</Text>
        <View style={[styles.card, { borderColor: '#ef4444' }]}>
          <TouchableOpacity style={styles.row} onPress={handleResetData}>
            <View style={styles.rowLeft}><Ionicons name="trash-outline" size={20} color="#ef4444" /><Text style={[styles.rowLabel, { color: '#ef4444' }]}>Reset Demo Data</Text></View>
            {resetLoading ? <ActivityIndicator size="small" color="#ef4444" /> : <Ionicons name="chevron-forward" size={20} color="#ef4444" />}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  avatarLetter: { fontSize: 32, fontWeight: 'bold', color: '#22d3ee' },
  userEmail: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  userRole: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginLeft: 4, letterSpacing: 1 },
  card: { backgroundColor: '#0f172a', borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: '#1e293b' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { color: 'white', fontSize: 16 },
  coachPreview: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 16, paddingBottom: 0, marginBottom: 20 },
  imageUploadBtn: { position: 'relative' },
  coachAvatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#334155' },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#22d3ee', padding: 6, borderRadius: 12 },
  coachPreviewLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  coachPreviewName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  inputLabel: { color: '#94a3b8', fontSize: 12, marginLeft: 16, marginBottom: 6 },
  input: { backgroundColor: '#1e293b', color: 'white', padding: 16, borderRadius: 12, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  saveBtn: { backgroundColor: '#22d3ee', margin: 16, marginTop: 0, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#0f172a', fontWeight: 'bold', fontSize: 16 },
});
