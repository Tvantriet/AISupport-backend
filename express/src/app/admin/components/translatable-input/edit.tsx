import React, { FC, useState, useRef } from "react";
import { ValueGroup, Box, FormGroup, FormMessage, Input, Label, Tooltip, Icon, Button } from "@adminjs/design-system";
import { BasePropertyProps, useTranslation, flat, useNotice } from "adminjs";
import { AddAlt, TrashCan } from "@carbon/icons-react";

const TranslatableEdit: FC<BasePropertyProps> = (props) => {
	const { onChange, property, record } = props;
	const { translateLabel, translateMessage } = useTranslation();
	const notice = useNotice();

	const recordValue = flat.get(record.params, property.path);
	const keys = record.params.keys?.split(",") ?? [];

	const [translations, setTranslations] = useState<Record<string, string>>(recordValue ?? {});
	const newLocaleRef = useRef(null);

	const { resourceId } = property;

	if (!resourceId) {
		throw new Error(`Cannot reference resource in property '${property.path}'`);
	}

	const error = record?.errors[property.path];

	const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = event.target;
		setTranslations((curr) => {
			const updated = { ...curr, [name]: value };
			onChange("translations", updated);

			return updated;
		});
	};

	const deleteTranslation = (locale: string) => {
		const shouldDelete = window.confirm(translateMessage("deleteLocale", resourceId));

		if (shouldDelete) {
			const newTranslations = flat.get(record.params, "newTranslations") ?? [];

			setTranslations((curr) => {
				const updated = { ...curr };
				delete updated[locale];
				onChange("translations", updated);
				return updated;
			});

			onChange("deleteTranslations", [...newTranslations, locale]);
		}
	};

	const addLocaleToList = () => {
		const { value } = newLocaleRef.current;
		if (value) {
			const lowerCasedvalue = value.toLowerCase();
			if (Object.keys(translations).includes(lowerCasedvalue))
				return notice({ message: "Locale already exists" });

			const newTranslations = flat.get(record.params, "newTranslations") ?? [];

			setTranslations((curr) => {
				const updated = { ...curr, [lowerCasedvalue]: keys?.join(" ") };
				onChange("translations", updated);

				return updated;
			});
			onChange("newTranslations", [...newTranslations, lowerCasedvalue]);
			// Reset value
			newLocaleRef.current.value = null;
		}
	};

	return (
		<FormGroup error={Boolean(error)}>
			<Label required={property.isRequired}>
				{translateLabel(property.label, resourceId)}
				{property?.description && (
					<Box mx="sm" display="inline-flex">
						<Tooltip key="translate" direction="right" title={property.description}>
							<Box>
								<Icon icon="Help" color="info" />
							</Box>
						</Tooltip>
					</Box>
				)}
			</Label>
			<Box width="100%" display="flex" style={{ flexDirection: "column" }}>
				{Object.entries(translations)?.map(([locale, title]) => (
					<ValueGroup key={locale} label={translateLabel(locale, resourceId)}>
						<Box display="flex">
							<Input
								name={locale}
								onChange={handleChange}
								value={title ?? ""}
								width={1}
								type={property.type}
								height="38px"
							/>
							<Button type="button" onClick={() => deleteTranslation(locale)}>
								<TrashCan />
							</Button>
						</Box>
					</ValueGroup>
				))}
			</Box>
			<Box display="flex">
				<Input ref={newLocaleRef} width={50} type={property.type} height="38px" />
				<Button
					style={{ display: "flex", alignItems: "center", marginLeft: "10px" }}
					type="button"
					onClick={addLocaleToList}
				>
					<AddAlt style={{ marginRight: "10px" }} />
					{translateLabel("AddNewTranslation", resourceId)}
				</Button>
			</Box>
			<FormMessage>{error?.message}</FormMessage>
		</FormGroup>
	);
};

export default TranslatableEdit;
