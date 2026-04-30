import { getAiDailyMaxRequests } from '$lib/server/ai/daily-budget';

export const load = async () => {
	const max = getAiDailyMaxRequests();
	return { aiDailyMax: max };
};
