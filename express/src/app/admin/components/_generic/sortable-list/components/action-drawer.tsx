import React, { FC, useMemo, useState, useEffect } from "react";
import { Box, Button, DrawerContent, DrawerFooter, Icon, Drawer } from "@adminjs/design-system";
import {
	useRecord,
	useTranslation,
	BasePropertyComponent,
	RecordJSON,
	ActionHeader,
	ResourceJSON,
	ActionJSON,
	BasePropertyJSON,
} from "adminjs";
import { unflatten } from "flat";
import { merge } from "lodash";
import { styled } from "@adminjs/design-system/styled-components";

const StyledDrawer = styled(Drawer)`
	flex-direction: row;
	width: 500px;
	max-width: 0;
	overflow-x: hidden;
	transition: all 350ms ease-out;
	${(props: any) =>
		props["data-css"] &&
		`
		right: 0;
		@media (min-width: 980px) {
			right: 500px;
		}`}
`;

// eslint-disable-next-line no-promise-executor-return
const delay = (delayInms: number) => new Promise((resolve) => setTimeout(resolve, delayInms));

type Props = {
	resource: ResourceJSON;
	record?: RecordJSON;
	propertyFilterArray?: string[];
	onSubmit: (record?: RecordJSON) => void;
};

/**
 * This open a slider inputform for easy creation and editing of referenced entities
 */
const ActionDrawer: FC<Props> = (props) => {
	const { resource, record, propertyFilterArray, onSubmit } = props;
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const { translateButton } = useTranslation();
	const resourceAction = resource.actions.find(({ name }) => name === (record ? "edit" : "new")) as ActionJSON;
	const isChildDrawer = useMemo(() => !!document.querySelector("section[id^='drawer-']"), [record]);

	/**
	 * Creates ref object for child record(edit), returns undefined if there is none(new)
	 */
	const recordChildRef = useMemo(() => {
		if (record) {
			const { id } = record;
			return { id, params: record, populated: {}, errors: {} } as unknown as RecordJSON;
		}
		return undefined;
	}, [record?.params]);

	const { handleChange, record: initialRecord, submit: handleSubmit } = useRecord(recordChildRef, resource?.id);

	/**
	 * Filters out input elements not used if specified in propertyFilterArray
	 */
	const propertyFilter = ({ propertyPath }: BasePropertyJSON) =>
		propertyFilterArray ? propertyFilterArray.includes(propertyPath) : true;

	/**
	 * Closes drawer and gives the optional updated record to parent resource
	 */
	const closeDrawer = async (updatedRecord?: RecordJSON) => {
		setOpen(() => {
			setLoading(false);
			return false;
		});
		// To close the drawer we give the close animation some time
		await delay(400);
		onSubmit(updatedRecord);
	};

	/**
	 * Submit function handles the write to
	 */
	const submit = async () => {
		setLoading(true);
		try {
			const response = await handleSubmit();

			if (response.data.record) {
				// In case of error we dont save record
				if (Object.keys(response.data.record?.errors).length >= 1) {
					setLoading(false);
					return;
				}

				// Grab full unflattened record response
				const updatedRecord = unflatten<RecordJSON, Record<string, unknown>>(response.data.record).params;

				closeDrawer(merge(record, updatedRecord, { title: unflatten(response.data.record.title) }));
			}
			// cleanup set useRecord to default state
			if (response.data.record.id) handleChange({ params: {}, populated: {}, errors: {} } as RecordJSON);
		} catch {
			setLoading(false);
		}
	};

	useEffect(() => {
		// This useEffect fires once to trigger drawer open animation
		if (!open) setOpen(true);
	}, []);

	useEffect(() => {
		// If there is no option to set isCorrect we set it to default true (this is the case for boolean, order and open questiontypes)
		if (initialRecord && !propertyFilterArray?.includes("isCorrect") && !initialRecord.params?.isCorrect) {
			handleChange("isCorrect", true);
		}
	}, [initialRecord]);

	return (
		<StyledDrawer id={`drawer-${record?.id}`} data-css={isChildDrawer} style={{ maxWidth: open ? "100%" : "0" }}>
			<Box flex flexGrow={1} flexDirection="column" data-css={"formTag"}>
				<DrawerContent id={record?.id} data-css={"contentTag"}>
					<ActionHeader resource={resource} action={{ ...resourceAction }} omitActions />
					{resource.editProperties
						?.filter(propertyFilter)
						.map((property) => (
							<BasePropertyComponent
								key={property.propertyPath}
								where="edit"
								onChange={handleChange}
								property={property}
								resource={resource}
								record={initialRecord as RecordJSON}
							/>
						))}
				</DrawerContent>
				<DrawerFooter data-css={"footerTag"}>
					<Button
						variant="primary"
						size="lg"
						type="button"
						data-css={"buttonTag"}
						data-testid="button-save"
						onClick={submit}
						style={{ marginRight: "10px" }}
						disabled={loading}
					>
						{loading ? <Icon icon="Fade" spin /> : null}
						{translateButton("save", resource.id)}
					</Button>
					<Button
						variant="light"
						size="lg"
						type="button"
						data-css={"buttonTag"}
						data-testid="button-cancel"
						onClick={() => closeDrawer()}
						disabled={loading}
					>
						{translateButton("cancel", resource.id)}
					</Button>
				</DrawerFooter>
			</Box>
		</StyledDrawer>
	);
};

export default ActionDrawer;
