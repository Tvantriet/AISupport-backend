import React, { useMemo, useState } from "react";
import { BasePropertyProps, CleanPropertyComponent, flat, useTranslation } from "adminjs";
import { SortableList } from "../_generic/sortable-list/sortable-list.js";
import { Section, Input, FormGroup, FormMessage, Label } from "@adminjs/design-system";

type ConditionalOption = { id: string; value: string; order?: string };

const ConditionalFieldInput = (props: BasePropertyProps) => {
	const { property, record, onChange } = props;
	const { translateProperty } = useTranslation();

	const {
		resourceId,
		props: { conditionalTypes, isArray },
	} = property;

	if (!resourceId) {
		throw new Error(`Cannot reference resource in property '${property.path}'`);
	}

	const error = record?.errors[property.path];

	const type = useMemo(() => record?.params.type, [record?.params.type]) as string;
	const recordValue = flat.get(record?.params, property.path) ?? "";

	const [selectedOptions, setSelectedOptions] = useState<ConditionalOption[]>(
		isArray && recordValue
			? recordValue?.split(",").map((option: string, index: number) => ({ id: index, value: option }))
			: [],
	);

	// If maxEntries is set we check if current selected total does not exceed
	const allowCreateMore = property.props?.maxEntries ? property.props.maxEntries > selectedOptions?.length : true;

	const setListReadyForSave = (options: ConditionalOption[]) => {
		if (!options.length) {
			onChange?.(property.path, null);
			return;
		}
		onChange?.(
			property.path,
			options
				.filter((option) => option.value)
				.map((option) => option.value)
				.join(","),
		);
	};

	/**
	 * Stores updated item in state
	 */
	const handleChange = (value: string | null, itemId: string): void => {
		setSelectedOptions((options: ConditionalOption[]) => {
			if (value) {
				const optionsArray = [...options];
				const itemIndex = optionsArray.findIndex((item) => item.id === itemId);

				if (itemIndex >= 0) {
					const item = optionsArray[itemIndex];
					item.value = value;
				}
				return optionsArray;
			}
			setListReadyForSave(options);
			return options;
		});
	};

	const handleListChange = (items: ConditionalOption[]) => {
		const updatedArray = items.map((item) => {
			if (item.id !== "empty") return item;
			return { id: `${items.length - 1}`, value: "" } as ConditionalOption;
		});
		setListReadyForSave(updatedArray);
		setSelectedOptions(updatedArray);
	};

	if (!conditionalTypes.includes(type)) {
		return <></>;
	}

	return isArray ? (
		<FormGroup error={Boolean(error)}>
			<Label>{translateProperty(property.label, resourceId)}</Label>
			<Section>
				<SortableList<ConditionalOption>
					items={selectedOptions}
					onChange={handleListChange}
					allowCreateMore={allowCreateMore}
					renderItem={(item) => (
						<Input
							width={1}
							id={item.id}
							type={property.type}
							value={item.value}
							onChange={(e) => handleChange(e.target.value, item.id)}
						/>
					)}
				/>
			</Section>
			<FormMessage>{error?.message}</FormMessage>
		</FormGroup>
	) : (
		<CleanPropertyComponent {...props} />
	);
};

export default ConditionalFieldInput;
