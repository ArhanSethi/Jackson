import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BehaviorState, Student, Topic } from '@/types';
import {
  buildAgentContext,
  ELEVENLABS_AGENT_ID,
  MODE_HINTS,
  type JacksonAgentContext,
} from '@/lib/elevenlabs';

// `@11labs/react` is web-first. We optional-require so the component still
// renders on platforms / dev environments where it can't be loaded; the UI
// then degrades to a "voice unavailable" pill instead of crashing.
let useConversation: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useConversation = require('@11labs/react').useConversation;
} catch {
  useConversation = null;
}

interface JacksonVoiceProps {
  student: Pick<Student, 'name' | 'grade'>;
  topic: Pick<Topic, 'id' | 'title' | 'description' | 'commonCoreStandard'>;
  behaviorState: BehaviorState;
  promptMode?: JacksonAgentContext['prompt_mode'];
  onMessage?: (message: string, role: 'jackson' | 'student') => void;
}

export function JacksonVoice({
  student,
  topic,
  behaviorState,
  promptMode = 'normal',
  onMessage,
}: JacksonVoiceProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const lastModeRef = useRef<JacksonAgentContext['prompt_mode']>(promptMode);
  const lastStateRef = useRef<BehaviorState>(behaviorState);

  const context = useMemo(
    () => buildAgentContext({ student, topic, behaviorState, promptMode }),
    [behaviorState, promptMode, student, topic],
  );

  const conversation = useConversation
    ? useConversation({
        onConnect: () => setStatus('live'),
        onDisconnect: () => setStatus('idle'),
        onError: () => setStatus('error'),
        onMessage: (msg: any) => {
          const role: 'jackson' | 'student' = msg?.source === 'user' ? 'student' : 'jackson';
          const text: string = msg?.message ?? msg?.text ?? '';
          if (text) onMessage?.(text, role);
        },
      })
    : null;

  const startSession = useCallback(async () => {
    if (!conversation) {
      setStatus('error');
      return;
    }
    if (!ELEVENLABS_AGENT_ID) {
      console.warn('[Jackson] Missing EXPO_PUBLIC_ELEVENLABS_AGENT_ID');
      setStatus('error');
      return;
    }
    try {
      setStatus('connecting');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        dynamicVariables: context,
        overrides: {
          agent: {
            firstMessage:
              promptMode === 'inactivity_check'
                ? `Hey ${student.name}, you still with me?`
                : undefined,
          },
        },
      });
    } catch (e) {
      console.warn('[Jackson] failed to start ElevenLabs session', e);
      setStatus('error');
    }
  }, [context, conversation, promptMode, student.name]);

  const endSession = useCallback(async () => {
    if (!conversation) return;
    try {
      await conversation.endSession();
    } catch {
      /* noop */
    }
    setStatus('idle');
  }, [conversation]);

  // Push updated context to the live agent whenever behaviour state or mode changes.
  useEffect(() => {
    if (!conversation || status !== 'live') return;
    const sameMode = lastModeRef.current === promptMode;
    const sameState = lastStateRef.current === behaviorState;
    if (sameMode && sameState) return;
    lastModeRef.current = promptMode;
    lastStateRef.current = behaviorState;
    try {
      conversation.sendContextualUpdate?.({
        text: `[context update] behavior=${behaviorState} mode=${promptMode}. ${MODE_HINTS[promptMode]}`,
      });
    } catch (e) {
      // Some SDK versions use a different method name; fall back silently.
      console.warn('[Jackson] contextual update failed', e);
    }
  }, [behaviorState, conversation, promptMode, status]);

  useEffect(() => {
    return () => {
      void endSession();
    };
  }, [endSession]);

  const live = status === 'live';
  const connecting = status === 'connecting';

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.dot,
            live && styles.dotLive,
            connecting && styles.dotConnecting,
          ]}
        />
        <Text style={styles.statusText}>
          {live ? 'Jackson is listening' : connecting ? 'Connecting…' : 'Tap to talk'}
        </Text>
      </View>

      <Pressable
        onPress={live ? endSession : startSession}
        style={({ pressed }) => [
          styles.bigButton,
          live ? styles.bigButtonLive : styles.bigButtonIdle,
          pressed && styles.bigButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={live ? 'End voice session' : 'Start voice session'}
      >
        <Text style={styles.bigButtonText}>{live ? 'End' : 'Talk to Jackson'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#4A90E2',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#BFD4EB',
  },
  dotLive: { backgroundColor: '#34C759' },
  dotConnecting: { backgroundColor: '#FFC93C' },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A5A6B',
  },
  bigButton: {
    minWidth: 160,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bigButtonIdle: { backgroundColor: '#4A90E2' },
  bigButtonLive: { backgroundColor: '#E55B5B' },
  bigButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  bigButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
