/**
 * Client-safe confetti trigger that avoids SSR/vendor-chunk bundling errors in Next.js
 */
export async function triggerConfetti(options?: {
  particleCount?: number;
  spread?: number;
  origin?: { y: number };
  colors?: string[];
}) {
  if (typeof window === 'undefined') return;

  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default || confettiModule;
    confetti({
      particleCount: options?.particleCount ?? 80,
      spread: options?.spread ?? 70,
      origin: options?.origin ?? { y: 0.6 },
      colors: options?.colors ?? ['#FFC800', '#000000', '#FFFFFF']
    });
  } catch (err) {
    console.warn('Confetti animation skipped:', err);
  }
}
