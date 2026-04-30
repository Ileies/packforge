export type PostFormDataWithProgressResult = {
	ok: boolean;
	status: number;
	body: unknown;
};

export type PostFormDataWithProgressOptions = {
	/** Request-Header (z. B. `authHeaders()`). */
	headers?: Record<string, string>;
	/** Fortschritt 0…1 während des Uploads (`lengthComputable`); sonst 0. */
	onUploadProgress?: (ratio: number) => void;
};

/**
 * `FormData` per POST senden mit **XMLHttpRequest**, damit `upload.onprogress`
 * den Upload-Fortschritt liefert (klassischer `fetch`-Workaround im Browser).
 */
export function postFormDataWithProgress(
	url: string,
	fd: FormData,
	options: PostFormDataWithProgressOptions = {}
): Promise<PostFormDataWithProgressResult> {
	const { headers = {}, onUploadProgress } = options;
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', url);
		xhr.withCredentials = true;
		for (const [k, v] of Object.entries(headers)) {
			xhr.setRequestHeader(k, v);
		}
		xhr.upload.onprogress = (e) => {
			onUploadProgress?.(e.lengthComputable ? e.loaded / e.total : 0);
		};
		xhr.onload = () => {
			let body: unknown = xhr.responseText;
			try {
				body = JSON.parse(xhr.responseText);
			} catch {
				/* Rohtext */
			}
			resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
		};
		xhr.onerror = () => reject(new Error('Netzwerkfehler beim Upload'));
		xhr.send(fd);
	});
}
