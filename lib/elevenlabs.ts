import type { BehaviorState, Student, Topic } from '@/types';

export const ELEVENLABS_AGENT_ID = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID ?? '';

/**
 * Dynamic variables we inject into the ElevenLabs Conversational AI agent.
 * The agent prompt should reference these as {{student_name}}, {{topic_title}}, etc.
 */
export interface JacksonAgentContext {
  student_name: string;
  student_grade: number;
  topic_id: string;
  topic_title: string;
  topic_description: string;
  common_core_standard: string;
  behavior_state: BehaviorState;
  prompt_mode: 'normal' | 'inactivity_check' | 'session_start' | 'session_end';
}

export function buildAgentContext(args: {
  student: Pick<Student, 'name' | 'grade'>;
  topic: Pick<Topic, 'id' | 'title' | 'description' | 'commonCoreStandard'>;
  behaviorState: BehaviorState;
  promptMode?: JacksonAgentContext['prompt_mode'];
}): JacksonAgentContext {
  return {
    student_name: args.student.name,
    student_grade: args.student.grade,
    topic_id: args.topic.id,
    topic_title: args.topic.title,
    topic_description: args.topic.description,
    common_core_standard: args.topic.commonCoreStandard,
    behavior_state: args.behaviorState,
    prompt_mode: args.promptMode ?? 'normal',
  };
}

/**
 * A short first-message the agent can use when a session starts.
 * Useful if you wire it into the agent config as the opening line.
 */
export function sessionOpener(name: string, topicTitle: string): string {
  return `Hey ${name} — ready to tackle ${topicTitle}? Show me what you know.`;
}

/**
 * Suggested prompts the app can pass to the agent when it changes mode.
 * Your ElevenLabs agent prompt should branch on {{prompt_mode}}.
 */
export const MODE_HINTS: Record<JacksonAgentContext['prompt_mode'], string> = {
  normal: 'Tutor the student through their topic. Ask questions, do not give the answer.',
  inactivity_check:
    "The student has been quiet for a while. Gently check in: 'Hey {{student_name}}, you still with me?'",
  session_start: 'Greet the student by name and set up the first problem.',
  session_end:
    'Wrap up warmly. Recap one thing they did well, one thing to practice next time.',
};
