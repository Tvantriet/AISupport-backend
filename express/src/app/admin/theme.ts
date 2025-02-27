import { Theme, ThemeOverride } from "@adminjs/design-system";

// All the theme properties are optional and are listed here as an example
const theme: Partial<ThemeOverride<Theme>> = {
	colors: {
		// global
		border: "#EEEEEF",
		text: "#0C1E29",

		// primary
		primary100: "#3040D6",
		primary80: "#6483F8",
		primary60: "#99A9EE",
		primary40: "#BBC5F4",
		primary20: "#DDE2F9",

		// accent
		accent: "#3B3552",

		// grey
		grey100: "#0C1E29",
		grey80: "#454655",
		grey60: "#898A9A",
		grey40: "#BBC3CB",
		grey20: "#F2F2F2",

		// common
		white: "#fff",
		black: "#000",

		// alerts
		errorDark: "#9d0616",
		error: "#C20012",
		errorLight: "#F9E5E7",

		successDark: "#007D7F",
		success: "#007D7F",
		successLight: "#E5F2F2",

		warningDark: "#A14F17",
		warning: "#A14F17",
		warningLight: "#F6EDE8",

		infoDark: "#4268F6",
		info: "#3040D6",
		infoLight: "#CBD5FD",

		// backgrounds
		bg: "#F8F9F9",
		filterBg: "#FBFBFB",
		container: "#FFFFFF",
		sidebar: "#FFFFFF",

		// elements
		inputBorder: "#BBC3CB",
		separator: "#BBC3CB",
		highlight: "#F2F2F2",
		// AdminJS logo color
		love: "#4D70EB",
	},
	// colorVariants: {
	// 	primary: "primary100",
	// 	secondary: "accent",
	// 	danger: "error",
	// 	success: "success",
	// 	info: "info",
	// 	warning: "warning",
	// 	text: "text",
	// },
	// space: {
	// 	xs: "2px",
	// 	sm: "4px",
	// 	default: "8px",
	// 	md: "8px",
	// 	lg: "16px",
	// 	xl: "24px",
	// 	xxl: "32px",
	// 	x3: "48px",
	// 	x4: "64px",
	// 	x5: "80px",
	// 	x6: "128px",
	// },
	// sizes: {
	// 	navbarHeight: "64px",
	// 	sidebarWidth: "300px",
	// 	maxFormWidth: "740px",
	// },
	// fontSizes: {
	// 	xs: "10px",
	// 	sm: "12px",
	// 	default: "14px",
	// 	md: "14px",
	// 	lg: "16px",
	// 	xl: "18px",
	// 	h4: "24px",
	// 	h3: "28px",
	// 	h2: "32px",
	// 	h1: "40px",
	// },
	// fontWeights: {
	// 	lighter: "200",
	// 	light: "300",
	// 	normal: "400",
	// 	bold: "700",
	// 	bolder: "900",
	// },
	// lineHeights: {
	// 	xs: "10px",
	// 	sm: "12px",
	// 	default: "16px",
	// 	md: "16px",
	// 	lg: "24px",
	// 	xl: "32px",
	// 	xxl: "40px",
	// },
	// shadows: {
	// 	auth: "0 15px 24px 0 rgba(137,138,154,0.15)",
	// 	cardHover: "0 4px 12px 0 rgba(137,138,154,0.4)",
	// 	drawer: "-2px 0 8px 0 rgba(137,138,154,0.2)",
	// 	card: "0rem 0.25rem 0.5rem rgba(0, 0, 0, 0.1)",
	// 	inputFocus: "0 2px 4px 0 rgba(135,159,250,0.4)",
	// 	buttonFocus: "0 4px 6px 0 rgba(56,202,241,0.3)",
	// },
	// breakpoints: ["577px", "769px", "1024px", "1324px"],
	// font: "'Roboto', sans-serif",
	// borders: {
	// 	input: `1px solid ${colors.border}`,
	// 	filterInput: " 1px rgba(255,255,255, 0.15)",
	// 	bg: `1px solid ${colors.bg}`,
	// 	default: `1px solid ${colors.border}`,
	// },
	// borderWidths: {
	// 	default: "0px",
	// },
	// defaultProps: {},
};

export default theme;
