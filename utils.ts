export function consoleBob(...args: any[]) {
	console.log(`[${new Date().toLocaleString()}] `, ...args);
}

export function secondsToTimeString(seconds: number): string {
	const minutes = Math.floor(Math.abs(seconds / 60));
	const hours = Math.floor(Math.abs(seconds / 3600));
	const days = Math.floor(Math.abs(seconds / 86400));
	const weeks = Math.floor(Math.abs(seconds / 604800));
	const years = Math.floor(Math.abs(seconds / 31536000));

	if (seconds < 60) {
		return `${seconds} seconds`;
	} else if (seconds < 3600) {
		return `${minutes} minutes`;
	} else if (seconds < 86400) {
		return `${hours} hours`;
	} else if (seconds < 604800) {
		return `${days} days`;
	} else if (seconds < 31536000) {
		return `${weeks} weeks`;
	} else {
		return `${years} years`;
	}
}
