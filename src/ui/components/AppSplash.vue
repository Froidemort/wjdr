<template>
	<div
		class="app-splash"
		:class="{ 'app-splash--exiting': exiting }"
		role="status"
		aria-live="polite"
		aria-label="Chargement de Grimorium"
	>
		<div class="app-splash__ambient" aria-hidden="true" />
		<div class="app-splash__glow" aria-hidden="true" />
		<div class="app-splash__content">
			<GrimoriumStrokeTitle
				size="splash"
				:animate="!prefersReducedMotion"
				@animation-end="onAnimationEnd"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useAppSplashDismiss } from '../composables/useAppSplashDismiss'
import GrimoriumStrokeTitle from './GrimoriumStrokeTitle.vue'

const props = defineProps<{
	ready: boolean
}>()

const emit = defineEmits<{
	dismissed: []
}>()

const { exiting, prefersReducedMotion, onAnimationEnd } = useAppSplashDismiss({
	ready: toRef(props, 'ready'),
	onDismissed: () => emit('dismissed'),
})
</script>

<style scoped>
.app-splash {
	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--color-base-100);
	opacity: 1;
	transition: opacity var(--app-splash-fade-duration) var(--app-splash-motion-easing);
}

.app-splash--exiting {
	opacity: 0;
	pointer-events: none;
}

.app-splash--exiting .app-splash__content {
	transform: scale(1.03);
	opacity: 0;
}

.app-splash__ambient {
	position: absolute;
	inset: 0;
	background:
		radial-gradient(
			ellipse 90% 55% at 50% 48%,
			color-mix(in oklab, var(--color-primary) 14%, transparent),
			transparent 72%
		),
		radial-gradient(
			ellipse 120% 90% at 50% 50%,
			transparent 35%,
			color-mix(in oklab, var(--color-neutral) 55%, transparent) 100%
		);
	pointer-events: none;
}

.app-splash__glow {
	position: absolute;
	left: 50%;
	top: 50%;
	width: min(var(--app-splash-glow-width), var(--app-splash-glow-max-width));
	aspect-ratio: 3 / 1;
	transform: translate(-50%, -50%);
	border-radius: 9999px;
	background: radial-gradient(
		ellipse at center,
		color-mix(in oklab, var(--color-accent) 22%, transparent),
		transparent 70%
	);
	filter: blur(var(--app-splash-glow-blur));
	opacity: 0;
	animation: app-splash-glow var(--app-splash-animation-duration) var(--app-splash-glow-easing) forwards;
	pointer-events: none;
}

.app-splash__content {
	position: relative;
	z-index: 1;
	width: min(var(--app-splash-content-width), var(--app-splash-content-max-width));
	padding-inline: var(--app-splash-content-padding-inline);
	text-align: center;
	transition:
		transform var(--app-splash-fade-duration) var(--app-splash-motion-easing),
		opacity var(--app-splash-content-fade-duration) ease;
}

/* APP_SPLASH.layout.mobileBreakpointPx */
@media (max-width: 640px) {
	.app-splash__content {
		width: min(var(--app-splash-content-width-mobile), var(--app-splash-content-max-width));
		padding-inline: var(--app-splash-content-padding-inline-mobile);
	}
}

@keyframes app-splash-glow {
	0%,
	55% {
		opacity: 0;
		transform: translate(-50%, -50%) scale(0.85);
	}

	80% {
		opacity: 0.55;
		transform: translate(-50%, -50%) scale(1);
	}

	100% {
		opacity: 0.35;
		transform: translate(-50%, -50%) scale(1.05);
	}
}

@media (prefers-reduced-motion: reduce) {
	.app-splash__glow {
		animation: none;
		opacity: 0.2;
	}

	.app-splash--exiting .app-splash__content {
		transform: none;
	}
}
</style>
