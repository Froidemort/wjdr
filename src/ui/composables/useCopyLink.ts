import { ref } from 'vue'

export function useCopyLink() {
	const copyFeedback = ref('')
	let copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null

	function buildLink(path: string): string {
		if (typeof window === 'undefined') return path
		return `${window.location.origin}${path}`
	}

	async function copyLink(path: string): Promise<void> {
		const url = buildLink(path)

		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url)
			} else {
				throw new Error('Clipboard API indisponible')
			}
			copyFeedback.value = 'Lien copié !'
		} catch {
			copyFeedback.value = 'Copie impossible automatiquement.'
		}

		if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer)
		copyFeedbackTimer = setTimeout(() => {
			copyFeedback.value = ''
		}, 2500)
	}

	return { copyFeedback, copyLink }
}
