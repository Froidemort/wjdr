<template>
	<label class="swap swap-rotate cursor-pointer btn btn-ghost btn-sm btn-square">
		<input 
			type="checkbox" 
			class="theme-controller hidden"
			value="grimorium-dark"
		/>
		
		<!-- Sun Icon (shown in light mode, swap-off) -->
		<div class="swap-off">
			<Sun class="h-5 w-5 opacity-70" />
		</div>
		
		<!-- Moon Icon (shown in dark mode, swap-on) -->
		<div class="swap-on">
			<Moon class="h-5 w-5 opacity-70" />
		</div>
	</label>
</template>

<script setup lang="ts">
import { Sun, Moon } from '@lucide/vue'
</script>
