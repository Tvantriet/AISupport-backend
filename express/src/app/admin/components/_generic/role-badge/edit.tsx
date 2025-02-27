import React, { FC, useState } from "react";
import { FormGroup, FormMessage, SelectAsync, Label } from "@adminjs/design-system";
import { ApiClient, EditPropertyProps, RecordJSON, SelectRecord, flat, useTranslation } from "adminjs";

type CombinedProps = EditPropertyProps;
type SelectRecordEnhanced = SelectRecord & {
	record: RecordJSON;
};

const Edit: FC<CombinedProps> = (props) => {
	const { onChange, property, record } = props;
	const { translateProperty } = useTranslation();

	const { reference: resourceId } = property;
	const rolesArray = flat.get(record?.params, "cmsRoles");

	const [selectedOption, setSelectedOption] = useState<{
		value: string | number;
		label: string;
		record?: RecordJSON;
	} | null>(
		rolesArray?.length >= 1 ? { value: rolesArray[0].id, label: rolesArray[0].name } : { value: "", label: "" },
	);

	if (!resourceId) {
		throw new Error(`Cannot reference resource in property '${property.path}'`);
	}

	const handleChange = (selected: SelectRecordEnhanced): void => {
		if (selected) {
			const { label, value, record: selectedRecord } = selected;
			setSelectedOption({ label, value, record: selectedRecord });
			onChange(property.path, value, selectedRecord);
		} else {
			setSelectedOption({ value: "", label: "" });
			onChange(property.path, null);
		}
	};

	const loadOptions = async (inputValue: string): Promise<SelectRecordEnhanced[]> => {
		const api = new ApiClient();

		const optionRecords = await api.searchRecords({
			resourceId,
			query: inputValue,
		});
		return optionRecords.map((optionRecord: RecordJSON) => ({
			value: optionRecord.id,
			label: optionRecord.title,
			record: optionRecord,
		}));
	};
	const error = record?.errors[property.path];

	return (
		<FormGroup error={Boolean(error)}>
			<Label>{translateProperty(property.label, resourceId)}</Label>
			<SelectAsync
				cacheOptions
				value={selectedOption}
				defaultOptions
				loadOptions={loadOptions}
				onChange={handleChange}
				isClearable
				isDisabled={property.isDisabled}
				{...property.props}
			/>
			<FormMessage>{error?.message}</FormMessage>
		</FormGroup>
	);
};

export default Edit;
