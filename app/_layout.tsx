import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#020617' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* NUCLEAR OPTION: Turn off the native header completely */}
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            headerShown: false 
          }} 
        />
        
        <Stack.Screen name="coach" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
