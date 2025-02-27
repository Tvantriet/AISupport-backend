import { styled } from "@adminjs/design-system/styled-components";
import { Box } from "@adminjs/design-system";

const Card = styled(Box)`
	display: ${({ flex }): string => (flex ? "flex" : "block")};
	color: ${({ theme }): string => theme.colors.grey100};
	padding: 16px;
	text-decoration: none;
	border: 1px solid transparent;
	&:hover {
		border: 1px solid ${({ theme }): string => theme.colors.primary100};
		box-shadow: ${({ theme }): string => theme.shadows.cardHover};
	}
`;

Card.defaultProps = {
	variant: "white",
	boxShadow: "card",
};

export default Card;
