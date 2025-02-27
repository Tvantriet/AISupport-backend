import React, { MouseEvent, useEffect } from "react";
import { Badge, ValueGroup } from "@adminjs/design-system";
import { BasePropertyProps, useRecord } from "adminjs";

const ToggleShow = (props: BasePropertyProps) => {
	const { record, resource, property, where } = props;
	const {
		handleChange,
		record: initialRecord,
		submit: handleSubmit,
		isSynced,
		setRecord,
	} = useRecord(record, resource?.id);

	const recordValue = initialRecord.params[property.path];
	const mappedValue = recordValue ? "Yes" : "No";

	useEffect(() => {
		if (initialRecord.title !== record.title) setRecord(record);
	}, [record]);

	useEffect(() => {
		if (!isSynced) {
			handleSubmit();
		}
	}, [isSynced]);

	const onClick = (event: MouseEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		handleChange(property.path, !recordValue);
	};

	return where === "show" ? (
		<ValueGroup label={property.label}>
			<Badge variant={recordValue ? "success" : "default"} onClick={onClick}>
				{mappedValue}
			</Badge>
		</ValueGroup>
	) : (
		<Badge variant={recordValue ? "success" : "default"} onClick={onClick}>
			{mappedValue}
		</Badge>
	);
};

export default ToggleShow;
