/** Single source of truth for the app splash screen (timing, layout, title). */
export const APP_SPLASH = {
	classNames: {
		activeHtmlClass: 'app-splash-active',
	},
	timing: {
		minMs: 1400,
		minReducedMs: 500,
		maxMs: 5000,
		fadeMs: 520,
		contentFadeMs: 480,
		animationMs: 3200,
	},
	title: {
		viewBoxWidth: 660,
		viewBoxHeight: 120,
		fontSizeDesktopPx: 108,
		fontSizeMobilePx: 104,
		letterSpacingDesktop: '0.03em',
		letterSpacingMobile: '0.02em',
	},
	layout: {
		/** Keep in sync with @media rules in theme.css and AppSplash.vue */
		mobileBreakpointPx: 640,
		contentMaxWidth: '56rem',
		contentWidthDesktop: '99vw',
		contentWidthMobile: '94vw',
		contentPaddingInlineDesktop: 'clamp(0.35rem, 2vw, 2.5rem)',
		contentPaddingInlineMobile: '0.75rem',
		glowWidth: '92vw',
		glowMaxWidth: '40rem',
		glowBlurPx: 28,
	},
	motion: {
		easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
		glowEasing: 'ease',
	},
} as const

export function getAppSplashViewBox(): string {
	const { viewBoxWidth, viewBoxHeight } = APP_SPLASH.title
	return `0 0 ${viewBoxWidth} ${viewBoxHeight}`
}

export function applyAppSplashCssVars(root: HTMLElement = document.documentElement): void {
	const { timing, title, layout, motion } = APP_SPLASH

	const vars: Record<string, string> = {
		'--app-splash-fade-duration': `${timing.fadeMs}ms`,
		'--app-splash-content-fade-duration': `${timing.contentFadeMs}ms`,
		'--app-splash-animation-duration': `${timing.animationMs}ms`,
		'--app-splash-title-font-size': `${title.fontSizeDesktopPx}px`,
		'--app-splash-title-font-size-mobile': `${title.fontSizeMobilePx}px`,
		'--app-splash-title-letter-spacing': title.letterSpacingDesktop,
		'--app-splash-title-letter-spacing-mobile': title.letterSpacingMobile,
		'--app-splash-content-max-width': layout.contentMaxWidth,
		'--app-splash-content-width': layout.contentWidthDesktop,
		'--app-splash-content-width-mobile': layout.contentWidthMobile,
		'--app-splash-content-padding-inline': layout.contentPaddingInlineDesktop,
		'--app-splash-content-padding-inline-mobile': layout.contentPaddingInlineMobile,
		'--app-splash-glow-width': layout.glowWidth,
		'--app-splash-glow-max-width': layout.glowMaxWidth,
		'--app-splash-glow-blur': `${layout.glowBlurPx}px`,
		'--app-splash-motion-easing': motion.easing,
		'--app-splash-glow-easing': motion.glowEasing,
	}

	for (const [key, value] of Object.entries(vars)) {
		root.style.setProperty(key, value)
	}
}
