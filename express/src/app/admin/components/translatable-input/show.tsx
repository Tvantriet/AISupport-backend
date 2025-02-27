import React from "react";
import { ValueGroup, Icon, Table, TableBody, TableHead, TableRow, TableCell, Box } from "@adminjs/design-system";
import { BasePropertyProps, useTranslation, flat } from "adminjs";

const TranslatableShow = (props: BasePropertyProps) => {
	const { record, property, where } = props;
	const { translateLabel } = useTranslation();

	const isOnlyHashesAndVariables = (input: string) => {
		const pattern = /^\s*#(?:\w*|)\s*#(?:\s*#(?:\w*|)\s*#)*\s*$/;

		return pattern.test(input);
	};

	const recordValue = flat.get(record.params, property.path);
	const needsTranslations =
		Object.values(recordValue).filter((value: string) => !value || isOnlyHashesAndVariables(value)).length > 0
			? "orange"
			: "#007d7f";

	const { resourceId } = property;

	return where === "show" ? (
		<ValueGroup label={property.label}>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Locale</TableCell>
						<TableCell>Available</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{Object.entries(recordValue)?.map(([key, value]) => (
						<TableRow key={key}>
							<TableCell>{translateLabel(key, resourceId)}</TableCell>
							<TableCell>
								<Icon icon={isOnlyHashesAndVariables(value as string) ? "X" : "Check"} />{" "}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</ValueGroup>
	) : (
		<Box
			style={{
				width: "16px",
				height: "16px",
				borderRadius: "50%",
				margin: "auto",
				backgroundColor: needsTranslations,
			}}
		/>
	);
};

export default TranslatableShow;
