import { useMediaQuery, useTimeoutFn } from '@vueuse/core'
import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { APP_SPLASH } from '../config/appSplash'

type UseAppSplashDismissOptions = {
	ready: Ref<boolean>
	onDismissed: () => void
}

export function useAppSplashDismiss({ ready, onDismissed }: UseAppSplashDismissOptions) {
	const { timing } = APP_SPLASH

	const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
	const animationDone = ref(false)
	const minTimeDone = ref(false)
	const exiting = ref(false)
	const minDurationMs = ref<number>(timing.minMs)
	const { start: startDismissTimer, stop: stopDismissTimer } = useTimeoutFn(
		onDismissed,
		timing.fadeMs,
		{ immediate: false }
	)
	const { start: startMinTimer, stop: stopMinTimer } = useTimeoutFn(
		() => {
			minTimeDone.value = true
			tryDismiss()
		},
		minDurationMs,
		{ immediate: false }
	)
	const { start: startMaxTimer, stop: stopMaxTimer } = useTimeoutFn(
		() => {
			animationDone.value = true
			minTimeDone.value = true
			dismiss()
		},
		timing.maxMs,
		{ immediate: false }
	)

	function dismiss(): void {
		if (exiting.value) {
			return
		}

		exiting.value = true
		stopDismissTimer()
		startDismissTimer()
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
		if (prefersReducedMotion.value) {
			animationDone.value = true
		}

		minDurationMs.value = prefersReducedMotion.value ? timing.minReducedMs : timing.minMs
		startMinTimer()
		startMaxTimer()
	})

	watch(ready, tryDismiss)
	watch(animationDone, tryDismiss)
	watch(minTimeDone, tryDismiss)

	onUnmounted(() => {
		stopDismissTimer()
		stopMinTimer()
		stopMaxTimer()
	})

	return {
		exiting,
		prefersReducedMotion,
		onAnimationEnd,
	}
}
