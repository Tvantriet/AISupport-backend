import React from "react";
import { useSelector } from "react-redux";
import {
	Box,
	BoxProps,
	H5,
	H2,
	Label,
	Illustration,
	Input,
	FormGroup,
	Button,
	Text,
	MessageBox,
	MadeWithLove,
	themeGet,
} from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import { ReduxState, useTranslation } from "adminjs";

const Wrapper = styled(Box)<BoxProps>`
	align-items: center;
	justify-content: center;
	flex-direction: column;
	height: 100%;
`;

const StyledLogo = styled.img`
	max-width: 80px;
	margin: ${themeGet("space", "md")} 0;
`;

const IllustrationsWrapper = styled(Box)<BoxProps>`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	& svg [stroke="#3B3552"] {
		stroke: rgba(255, 255, 255, 0.5);
	}
	& svg [fill="#3040D6"] {
		fill: rgba(255, 255, 255, 1);
	}
`;

export type AuthUser = {
	email: string;
	password: string;
	title: string;
	theme: string;
};

export type LoginProps = {
	credentials: Pick<AuthUser, "email" | "password">;
	action: string;
	errorMessage?: string;
	children?: any;
};

export const Login: React.FC = () => {
	const { translateComponent, translateMessage } = useTranslation();
	const branding = useSelector((state: ReduxState) => state.branding);
	const { action, errorMessage } = (window as any).__APP_STATE__ ?? {};

	return (
		<Wrapper flex variant="grey">
			<Box bg="white" flex boxShadow="login" borderRadius="10px" width={[1, 2 / 3, "auto"]}>
				<Box
					bg="primary100"
					color="white"
					p="x3"
					width="380px"
					borderRadius="10px 0 0 10px"
					flexGrow={0}
					display={["none", "none", "block"]}
					position="relative"
				>
					<H2 fontWeight="lighter">{translateComponent("Login.welcomeHeader")}</H2>
					<Text fontWeight="lighter" mt="default">
						{translateComponent("Login.welcomeMessage")}
					</Text>
					<IllustrationsWrapper p="xxl">
						<Box display="inline" mr="default">
							<Illustration variant="Planet" width={82} height={91} />
						</Box>
						<Box display="inline">
							<Illustration variant="Astronaut" width={82} height={91} />
						</Box>
						<Box display="inline" position="relative" top="-20px">
							<Illustration variant="FlagInCog" width={82} height={91} />
						</Box>
					</IllustrationsWrapper>
				</Box>
				<Box as="form" action={action} method="post" p="x3" flexGrow={1} width={["100%", "100%", "480px"]}>
					<H5 marginBottom="xxl">
						{branding.logo ? (
							<StyledLogo src={branding.logo} alt={branding.companyName} />
						) : (
							branding.companyName
						)}
					</H5>
					{errorMessage && (
						<MessageBox
							my="lg"
							message={errorMessage.split(" ").length > 1 ? errorMessage : translateMessage(errorMessage)}
							variant="danger"
						/>
					)}
					<FormGroup>
						<Label required>{translateComponent("Login.properties.email")}</Label>
						<Input name="email" placeholder={translateComponent("Login.properties.email")} />
					</FormGroup>
					<FormGroup>
						<Label required>{translateComponent("Login.properties.password")}</Label>
						<Input
							type="password"
							name="password"
							placeholder={translateComponent("Login.properties.password")}
							autoComplete="new-password"
						/>
					</FormGroup>
					<Text mt="xl" textAlign="center">
						<Button variant="contained">{translateComponent("Login.loginButton")}</Button>
					</Text>
					<Text mt="lg" textAlign="center">
						{translateMessage("forgotPasswordQuestion")}{" "}
						<a href="/password-recovery">{translateMessage("forgotPassword")}</a>
					</Text>
				</Box>
			</Box>
			{branding.withMadeWithLove ? (
				<Box mt="xxl">
					<MadeWithLove />
				</Box>
			) : null}
		</Wrapper>
	);
};

export default Login;
