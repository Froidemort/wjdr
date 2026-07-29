<template>
	<div
		class="grim-title-stroke"
		:class="[
			animate ? 'grim-title-stroke--once' : 'grim-title-stroke--static',
			size === 'splash' ? 'grim-title-stroke--splash' : '',
		]"
	>
		<svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
			<text
				x="50%"
				y="50%"
				dy=".35em"
				text-anchor="middle"
				class="grim-title-stroke__text grim-modal-title"
				:class="sizeClass"
				@animationend="onAnimationEnd"
			>
				Grimorium
			</text>
		</svg>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getAppSplashViewBox } from '../config/appSplash'

const props = withDefaults(
	defineProps<{
		animate?: boolean
		size?: 'md' | 'lg' | 'splash'
	}>(),
	{
		animate: true,
		size: 'lg',
	},
)

const emit = defineEmits<{
	animationEnd: []
}>()

const viewBox = computed(() => (props.size === 'splash' ? getAppSplashViewBox() : '0 0 400 80'))

const sizeClass = computed(() => {
	if (props.size === 'splash') {
		return ''
	}

	return props.size === 'md' ? 'text-4xl sm:text-5xl' : 'text-6xl sm:text-7xl'
})

function onAnimationEnd(event: AnimationEvent): void {
	if (event.animationName !== 'grim-title-stroke') {
		return
	}

	emit('animationEnd')
}
</script>
