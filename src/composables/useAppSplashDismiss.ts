import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { APP_SPLASH } from '../config/appSplash'

type UseAppSplashDismissOptions = {
	ready: Ref<boolean>
	onDismissed: () => void
}

export function useAppSplashDismiss({ ready, onDismissed }: UseAppSplashDismissOptions) {
	const { timing } = APP_SPLASH

	const prefersReducedMotion = ref(false)
	const animationDone = ref(false)
	const minTimeDone = ref(false)
	const exiting = ref(false)

	let dismissTimer: ReturnType<typeof setTimeout> | null = null
	let minTimer: ReturnType<typeof setTimeout> | null = null
	let maxTimer: ReturnType<typeof setTimeout> | null = null

	function clearDismissTimer(): void {
		if (dismissTimer) {
			clearTimeout(dismissTimer)
			dismissTimer = null
		}
	}

	function dismiss(): void {
		if (exiting.value) {
			return
		}

		exiting.value = true
		dismissTimer = setTimeout(onDismissed, timing.fadeMs)
	}

	function tryDismiss(): void {
		if (!ready.value || !animationDone.value || !minTimeDone.value || exiting.value) {
			return
		}

		dismiss()
	}

	function onAnimationEnd(): void {
		animationDone.value = true
		tryDismiss()
	}

	onMounted(() => {
		prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

		if (prefersReducedMotion.value) {
			animationDone.value = true
		}

		const minDuration = prefersReducedMotion.value ? timing.minReducedMs : timing.minMs

		minTimer = setTimeout(() => {
			minTimeDone.value = true
			tryDismiss()
		}, minDuration)

		maxTimer = setTimeout(() => {
			animationDone.value = true
			minTimeDone.value = true
			dismiss()
		}, timing.maxMs)
	})

	watch(ready, tryDismiss)
	watch(animationDone, tryDismiss)
	watch(minTimeDone, tryDismiss)

	onUnmounted(() => {
		clearDismissTimer()
		if (minTimer) {
			clearTimeout(minTimer)
		}
		if (maxTimer) {
			clearTimeout(maxTimer)
		}
	})

	return {
		exiting,
		prefersReducedMotion,
		onAnimationEnd,
	}
}
