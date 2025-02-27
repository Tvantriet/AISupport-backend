import React from "react";
import { styled } from "@adminjs/design-system/styled-components";
import { Box, H2, Text } from "@adminjs/design-system";
import { useTranslation } from "adminjs";

const Overlay = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background-image: linear-gradient(to right, rgba(0, 0, 0, 0.4), rgba(12, 57, 140, 1));
`;

const pageHeaderHeight = 284;
const pageHeaderPaddingY = 74;
const pageHeaderPaddingX = 250;

const DashboardHeader: React.FC = () => {
	const { translateMessage } = useTranslation();
	return (
		<Box position="relative" overflow="hidden" data-css="default-dashboard">
			<Box position="absolute" top={-80} left={-4} opacity={[0.2, 0.4, 1]} animate>
				<img height={450} src="/images/logo.png" alt="logo" />
			</Box>
			<Overlay />
			<Box
				bg="grey100"
				height={pageHeaderHeight}
				py={pageHeaderPaddingY}
				px={["default", "lg", pageHeaderPaddingX]}
			>
				<Text textAlign="center" color="white">
					<H2>{translateMessage("welcomeOnBoard_title")}</H2>
					<Text opacity={0.8}>{translateMessage("welcomeOnBoard_subtitle")}</Text>
				</Text>
			</Box>
		</Box>
	);
};

export default DashboardHeader;
