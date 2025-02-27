import React from "react";
import { Badge, ValueGroup } from "@adminjs/design-system";
import { BasePropertyProps, useTranslation } from "adminjs";

const RoleBadge = (props: BasePropertyProps) => {
	const { record, property, where } = props;
	const { translateProperty } = useTranslation();

	const { reference: resourceId } = property;
	const role = Object.values(record?.params ?? {}).find((value: string) => value === "admin") ? "Admin" : "User";

	return where === "show" ? (
		<ValueGroup label={translateProperty(property.label, resourceId)}>
			<Badge variant={"primary"} outline={true}>
				{role}
			</Badge>
		</ValueGroup>
	) : (
		<Badge variant={"primary"} outline={true}>
			{role}
		</Badge>
	);
};

export default RoleBadge;
