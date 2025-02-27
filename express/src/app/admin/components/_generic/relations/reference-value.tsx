import React from "react";
import { styled } from "@adminjs/design-system/styled-components";
import { Link } from "react-router-dom";
import { Button } from "@adminjs/design-system";
import { ViewHelpers, PropertyJSON } from "adminjs";
import { getLabel } from "../../../../utils/MiscHelpers.js";

interface Props {
	property: PropertyJSON;
	record: any;
}

const StyledLink = styled<any>(Link)`
	padding-left: ${({ theme }): string => theme.space.xs};
	padding-right: ${({ theme }): string => theme.space.xs};
`;

const ReferenceValue: React.FC<Props> = (props) => {
	const { property, record } = props;

	const h = new ViewHelpers();
	const refId = record.id;

	const valueId = property.props.valueId || refId;

	if (!property.reference) {
		throw new Error(`property: "${property.path}" does not have a reference`);
	}

	const href = h.recordActionUrl({
		resourceId: property?.reference ?? "",
		recordId: refId,
		actionName: "show",
	});
	return (
		<StyledLink to={href}>
			<Button size="sm" rounded>
				{getLabel(record[valueId])}
			</Button>
		</StyledLink>
	);
};

export default ReferenceValue;
