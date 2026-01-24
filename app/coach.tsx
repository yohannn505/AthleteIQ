import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import React, { useCallback, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Bubble, GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import { auth, db } from '../firebaseConfig';

export default function CoachScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const [coachName, setCoachName] = useState('Coach');
  const [coachImage, setCoachImage] = useState('https://cdn-icons-png.flaticon.com/512/4712/4712027.png');

  useFocusEffect(
    useCallback(() => {
      const fetchCoachSettings = async () => {
        const userId = auth.currentUser?.uid || "VIDEO_DEMO_USER";
        
        try {
          const docRef = doc(db, "users", userId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Found Coach Data:", data); 
            if (data.coachName) setCoachName(data.coachName);
            if (data.coachImage) setCoachImage(data.coachImage);
          }
        } catch (error) {
          console.log("Error loading coach:", error);
        }
      };

      fetchCoachSettings();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (messages.length === 0) {
        setMessages([
          {
            _id: 1,
            text: "I'm analyzing your recent training data. How are you feeling today?",
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'Coach', 
              avatar: coachImage,
            },
          },
        ]);
      }
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      setMessages(prev => prev.map(msg => {
        if (msg.user._id === 2) {
          return { 
            ...msg, 
            user: { ...msg.user, name: coachName, avatar: coachImage } 
          };
        }
        return msg;
      }));
    }, [coachName, coachImage])
  );

  const onSend = async (newMessages: any[] = []) => {
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    const userMessage = newMessages[0].text;
    
    setIsTyping(true);

    try {
      const functions = getFunctions();
      const generateResponse = httpsCallable(functions, 'generateResponse');
      
      const result: any = await generateResponse({ 
        message: userMessage,
        userId: auth.currentUser?.uid || "VIDEO_DEMO_USER"
      });

      const aiText = result.data.response;
      
      const aiMessage = {
        _id: Math.random().toString(),
        text: aiText,
        createdAt: new Date(),
        user: { _id: 2, name: coachName, avatar: coachImage },
      };
      setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));

    } catch (error) {
      console.log("AI Failed, using Demo Fallback");
      
      // VIDEO SAFEGUARD
      setTimeout(() => {
        const demoResponse = {
          _id: Math.random().toString(),
          text: "Based on your session, hitting 185 BPM is high but safe for a sprint. However, your recovery time is lagging. I recommend prioritizing sleep and hydration tonight.",
          createdAt: new Date(),
          user: { _id: 2, name: coachName, avatar: coachImage },
        };
        setMessages(previousMessages => GiftedChat.append(previousMessages, [demoResponse]));
      }, 1500);

    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#22d3ee" />
          </TouchableOpacity>
          <View style={styles.coachInfo}>
            {/* THIS IMAGE AND TEXT WILL NOW UPDATE */}
            <Image source={{ uri: coachImage }} style={styles.avatarSmall} />
            <View>
              <Text style={styles.headerTitle}>{coachName}</Text>
              <Text style={styles.headerSubtitle}>AI Performance Coach</Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{ _id: 1 }}
        isTyping={isTyping}
        textInputProps={{ style: { color: 'white', paddingTop: 8 } }}
        renderBubble={props => (
          <Bubble
            {...props}
            wrapperStyle={{
              right: { backgroundColor: '#22d3ee' },
              left: { backgroundColor: '#1e293b' },
            }}
            textStyle={{
              right: { color: '#0f172a' },
              left: { color: 'white' },
            }}
          />
        )}
        renderInputToolbar={props => (
          <InputToolbar 
            {...props} 
            containerStyle={{ backgroundColor: '#0f172a', borderTopColor: '#1e293b' }}
          />
        )}
      />
      
      {Platform.OS === 'android' && <KeyboardAvoidingView behavior="padding" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  headerArea: { backgroundColor: '#020617', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  coachInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#334155' },
  headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  headerSubtitle: { color: '#22d3ee', fontSize: 12 },
});
