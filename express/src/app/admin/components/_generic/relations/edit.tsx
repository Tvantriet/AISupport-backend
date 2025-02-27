import React, { FC, useState, useEffect, useRef, useMemo } from "react";
import { FormGroup, FormMessage, Label, Section } from "@adminjs/design-system";
import { ApiClient, BasePropertyProps, ParamsType, RecordJSON, useResource } from "adminjs";
import Select from "react-select";
import pkg from "flat";
const { unflatten } = pkg;
import { SortableList } from "../sortable-list/sortable-list.js";
import ActionDrawer from "../sortable-list/components/action-drawer.js";
import { getLabel } from "../../../../utils/MiscHelpers.js";
import MenuList from "./components/menu-list.js";
import Control, { OptionType } from "./components/control.js";

type CombinedProps = BasePropertyProps & {
	propertyFilterArray?: string[];
	errorMessage?: { message: string };
	[key: string]: any;
};

type CombinedRecordProps = RecordJSON & {
	[key: string]: string;
};

const RelationsEditInput: FC<CombinedProps> = (props) => {
	const { onChange, property, record, propertyFilterArray, errorMessage } = props;
	const childResource = useResource(property.props?.referenceId);
	const [selectableOptions, setSelectableOptions] = useState<OptionType[]>([]);
	const [openActionDrawerForId, setOpenActionDrawerForId] = useState<string | null>(null);
	const loadedOptions = useRef(false);
	const { reference: resourceId } = property;

	if (!resourceId) {
		throw new Error(`Cannot reference resource in property '${property.path}'`);
	}

	const error = errorMessage ?? record?.errors[property.path];

	const recordParams = unflatten<ParamsType, Record<string, unknown>>(record?.params ?? {});

	/**
	 * Returns the options ordered according to order saved in db
	 */
	const orderedArray: CombinedRecordProps[] = useMemo(() => {
		const selectedValues = (recordParams[property.path] as CombinedRecordProps[]) || [];
		if (!Array.isArray(selectedValues)) return [selectedValues] as CombinedRecordProps[];

		// If order is kept in child resource
		if (property.props?.orderInChild) {
			return selectedValues.sort(
				(a, b) => parseInt(a[property.props?.arrayOrderId], 10) - parseInt(b[property.props?.arrayOrderId], 10),
			);
		}
		// If order is kept in current resource
		const orderedIds = ((recordParams[property.props?.arrayOrderId] as string[]) || []).map(Number);
		if (Array.isArray(orderedIds) && orderedIds.length > 0) {
			return selectedValues.sort((a, b) => orderedIds.indexOf(Number(a.id)) - orderedIds.indexOf(Number(b.id)));
		}
		return selectedValues;
	}, [recordParams]);

	const [selectedOptions, setSelectedOptions] = useState<OptionType[]>(
		orderedArray.map((selectedValue) => ({
			id: selectedValue.id,
			label: getLabel(selectedValue[property.props.valueId ?? selectedValue.id]),
			record: selectedValue,
		})),
	);
	// If maxEntries is set we check if current selected total does not exceed
	const allowCreateMore = property.props?.maxEntries ? property.props.maxEntries > selectedOptions?.length : true;
	/**
	 * Stores updated item in state
	 */
	const handleChange = (updatedItem: OptionType | null, itemId: string): void => {
		setSelectedOptions((options: OptionType[]) => {
			if (updatedItem) {
				const optionsArray = [...options];
				const itemIndex = optionsArray.findIndex((item) => item.id === itemId);

				if (itemIndex >= 0) optionsArray[itemIndex] = updatedItem;
				return optionsArray;
			}
			return options;
		});
	};

	/**
	 * Checks if the option already exists if so it overwrites, otherwise it creates a selected new option
	 */
	const processOption = async (recordOption?: ParamsType) => {
		// Grab actionDrawerId and close action drawer
		const actionDrawerId = openActionDrawerForId;
		setOpenActionDrawerForId(null);

		setSelectedOptions((options: OptionType[]) => {
			if (recordOption) {
				const optionsArray = [...options];
				const itemIndex = optionsArray.findIndex((item) => item.id === actionDrawerId);
				let newOption = { id: recordOption.id, label: getLabel(recordOption.title), record: recordOption };

				// Very specific if usecase! --> do not use in boilerplate
				if (optionsArray[itemIndex] && record?.params?.questionType === "Image") {
					const answerText = {
						basque: `Image-${recordOption.id}`,
						spanish: `Image-${recordOption.id}`,
					};
					newOption = {
						...newOption,
						label: getLabel(answerText),
						record: { ...newOption.record, answerText },
					};
				}

				if (itemIndex >= 0) optionsArray[itemIndex] = newOption;

				// Make sure the new option is available in optionsdropdown
				setSelectableOptions((curr: OptionType[]) => [...curr, newOption]);

				return optionsArray;
			}
			return options;
		});
	};

	/**
	 * Grabs all selectable options from db
	 */
	const loadOptions = async (inputValue: string) => {
		const api = new ApiClient();
		loadedOptions.current = false;

		const optionRecords = await api.searchRecords({
			resourceId,
			query: inputValue,
		});
		setSelectableOptions(
			optionRecords
				.filter(
					(optionRecord: RecordJSON) =>
						selectedOptions.findIndex(({ id }: OptionType) => id === optionRecord.id) === -1,
				)
				.map((optionRecord: RecordJSON) => ({
					id: optionRecord.id,
					label: getLabel(optionRecord.title),
					record: optionRecord.params as RecordJSON,
				})),
		);
		loadedOptions.current = true;
	};

	// Check if selectable options are fetched
	useEffect(() => {
		if (!loadedOptions.current) {
			loadOptions("");
		}
	}, [loadedOptions]);

	// Writes the updated record to parent
	useEffect(() => {
		const { arrayOrderId, maxEntries } = property.props;
		if (selectedOptions.length > 0) {
			// Clean up empty selects
			const selected = selectedOptions.filter((option: OptionType) => option.id !== "empty");
			// eslint-disable-next-line max-len
			const childRecords =
				maxEntries && maxEntries > 1
					? selected.map((option: OptionType) => option.record)
					: selected[0]?.record;

			onChange?.(property.path, childRecords);
			if (arrayOrderId) {
				onChange?.(
					arrayOrderId,
					selected.map((option: OptionType) => option.id),
				);
			}
		} else {
			onChange?.(property.path, null);
			if (arrayOrderId) {
				onChange?.(arrayOrderId, null);
			}
		}
	}, [selectedOptions]);

	return (
		<>
			<FormGroup error={Boolean(error)}>
				<Label>{property.label}</Label>
				<Section>
					<SortableList<OptionType>
						items={selectedOptions}
						onChange={setSelectedOptions}
						allowCreateMore={allowCreateMore}
						renderItem={(item) => (
							<Select
								options={selectableOptions}
								value={item}
								onChange={(updatedItem) => handleChange(updatedItem, item.id as string)}
								isLoading={!loadedOptions.current}
								getOptionValue={(option) => option.label}
								closeMenuOnSelect
								components={{
									MenuList: MenuList(!!property.props?.referenceId, setOpenActionDrawerForId),
									Control: Control(setOpenActionDrawerForId, !!openActionDrawerForId),
								}}
							/>
						)}
					/>
				</Section>
				<FormMessage>{error?.message}</FormMessage>
			</FormGroup>
			{openActionDrawerForId && childResource && (
				<ActionDrawer
					record={
						selectedOptions.find(({ id }: OptionType) => id === openActionDrawerForId)?.record as RecordJSON
					}
					propertyFilterArray={propertyFilterArray}
					resource={childResource}
					onSubmit={processOption}
				/>
			)}
		</>
	);
};

export default RelationsEditInput;
