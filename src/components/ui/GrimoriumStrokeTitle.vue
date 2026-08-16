<template>
	<div
		class="grim-title-stroke"
		:class="animate ? 'grim-title-stroke--once' : 'grim-title-stroke--static'"
	>
		<svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
			<text
				x="50%"
				y="50%"
				dy=".35em"
				text-anchor="middle"
				class="grim-title-stroke__text grim-modal-title"
				@animationend="onAnimationEnd"
			>
				Grimorium
			</text>
		</svg>
	</div>
</template>

<script setup lang="ts">
import { getAppSplashViewBox } from '../../config/appSplash'

withDefaults(
	defineProps<{
		animate?: boolean
	}>(),
	{
		animate: true,
	},
)

const emit = defineEmits<{
	animationEnd: []
}>()

const viewBox = getAppSplashViewBox()

function onAnimationEnd(event: AnimationEvent): void {
	if (event.animationName !== 'grim-title-stroke') {
		return
	}

	emit('animationEnd')
}
</script>
