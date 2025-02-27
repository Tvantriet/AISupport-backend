import React from "react";
import { BasePropertyProps, ParamsType } from "adminjs";
import { Badge, ValueGroup } from "@adminjs/design-system";
import pkg from "flat";
const { unflatten } = pkg;

const DropZoneShow: React.FC<BasePropertyProps> = (props) => {
	const { property, record, where } = props;
	const recordValue =
		(unflatten<ParamsType, Record<string, unknown>>(record?.params ?? {})[property.path] as string) ?? "";

	const media = recordValue ? (
		<img src={recordValue} width={where === "show" ? "100px" : "35px"} />
	) : (
		<Badge>No media</Badge>
	);

	return where === "show" ? <ValueGroup label={property.label}>{media}</ValueGroup> : <>{media}</>;
};

export default DropZoneShow;
