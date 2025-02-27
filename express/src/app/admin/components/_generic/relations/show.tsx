import React, { FC, useMemo } from "react";
import { ValueGroup } from "@adminjs/design-system";
import { RecordJSON, PropertyJSON, ParamsType } from "adminjs";
import { unflatten } from "flat";
import ReferenceValue from "./reference-value.js";

type Props = {
	property: PropertyJSON;
	record: RecordJSON;
	ItemComponent: typeof React.Component;
};

type CombinedRecordProps = RecordJSON & {
	[key: string]: string;
};

const ManyToManyShow: FC<Props> = (props) => {
	const { property, record } = props;
	const DELIMITER = ".";

	const recordParams = unflatten<ParamsType, Record<string, unknown>>(record?.params);

	const orderedArray = useMemo(() => {
		const selectedValues = (recordParams[property.path] as CombinedRecordProps[]) || [];
		if (!Array.isArray(selectedValues)) return [selectedValues] as CombinedRecordProps[];

		// Order is kept in child resource
		if (property.props?.orderInChild) {
			return selectedValues.sort(
				(a, b) => parseInt(a[property.props?.arrayOrderId], 10) - parseInt(b[property.props?.arrayOrderId], 10),
			);
		}
		// Order is kept in current resource
		const orderedIds = ((recordParams[property.props?.arrayOrderId] as string[]) || []).map(Number);
		if (Array.isArray(orderedIds) && orderedIds.length > 0) {
			return selectedValues.sort((a, b) => orderedIds.indexOf(Number(a.id)) - orderedIds.indexOf(Number(b.id)));
		}
		return selectedValues;
	}, [recordParams]);

	const getSubpropertyPath = (path: string, index: number) => [path, index].join(DELIMITER);

	const convertToSubProperty = (arrayProperty: PropertyJSON, index: number): PropertyJSON => ({
		...arrayProperty,
		path: getSubpropertyPath(arrayProperty.path, index),
		label: `[${index + 1}]`,
		isArray: false,
		isDraggable: false,
	});

	return (
		<ValueGroup label={property.label}>
			{orderedArray?.map((item, i) => {
				const itemProperty = convertToSubProperty(property, i);

				return <ReferenceValue key={itemProperty.path} {...props} record={item} property={itemProperty} />;
			})}
		</ValueGroup>
	);
};

export default ManyToManyShow;
