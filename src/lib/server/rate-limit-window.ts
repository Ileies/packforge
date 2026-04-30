/** Sliding-Window-Zähler pro Schlüssel (In-Memory, ein Node-Prozess). */

export function createSlidingWindowLimiter() {
	const buckets = new Map<string, number[]>();

	return function allow(
		key: string,
		max: number,
		windowMs: number,
		now: number = Date.now()
	): { allowed: boolean; retryAfterSec: number } {
		let stamps = buckets.get(key);
		if (!stamps) {
			stamps = [];
			buckets.set(key, stamps);
		}
		stamps = stamps.filter((t) => now - t < windowMs);
		buckets.set(key, stamps);

		if (stamps.length >= max) {
			const oldest = stamps[0]!;
			const retryAfterMs = Math.max(0, windowMs - (now - oldest));
			return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
		}
		stamps.push(now);
		return { allowed: true, retryAfterSec: 0 };
	};
}
