// Dev-only stub. Real cloud TTS provider is a decision for a later, dedicated
// ticket — do not wire in MiniMax or ElevenLabs here (see
// jackson_v1_clean_build_spec.md).

export function speak(text: string): void {
  console.log('[speak]', text);
}
