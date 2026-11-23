import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { apiClient } from '@/services/api-client';

type ConnectionStatus = 'Connecting' | 'Connected' | 'Offline';

const gameModes = ['Solo Battle', 'Online Battle', 'Creature Collection'];

export default function HomeScreen() {
  const [status, setStatus] = useState<ConnectionStatus>('Connecting');

  const checkHealth = useCallback(async () => {
    setStatus('Connecting');

    try {
      await apiClient.get<unknown>('/api/health');
      setStatus('Connected');
    } catch {
      setStatus('Offline');
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>PHASE 1</Text>
        <Text style={styles.title}>Battle Arena</Text>
        <Text style={styles.subtitle}>
          Build your team. Master your strategy. Enter the arena.
        </Text>
      </View>

      <View style={styles.modes}>
        {gameModes.map((mode) => (
          <View key={mode} style={styles.card}>
            <Text style={styles.cardTitle}>{mode}</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </View>
        ))}
      </View>

      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusLabel}>SYSTEM STATUS</Text>
          <Text style={[styles.status, styles[`status${status}`]]}>{status}</Text>
        </View>
        {status === 'Offline' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void checkHealth()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0A0C14',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  hero: {
    marginBottom: 40,
  },
  eyebrow: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  subtitle: {
    color: '#A5A7B3',
    fontSize: 17,
    lineHeight: 26,
    marginTop: 14,
    maxWidth: 340,
  },
  modes: {
    gap: 14,
  },
  card: {
    backgroundColor: '#151824',
    borderColor: '#272B3D',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  cardTitle: {
    color: '#F4F4F5',
    fontSize: 20,
    fontWeight: '700',
  },
  comingSoon: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#10121B',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    padding: 18,
  },
  statusLabel: {
    color: '#717586',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  status: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 5,
  },
  statusConnecting: {
    color: '#FBBF24',
  },
  statusConnected: {
    color: '#34D399',
  },
  statusOffline: {
    color: '#FB7185',
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonPressed: {
    opacity: 0.75,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
