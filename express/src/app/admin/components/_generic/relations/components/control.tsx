import React, { MouseEventHandler } from "react";
import { ParamsType } from "adminjs";
import { components, ControlProps } from "react-select";
import { styled } from "@adminjs/design-system/styled-components";
import { Checkmark, Close, Edit } from "@carbon/icons-react";

export type OptionType = {
	id: string;
	label: string;
	record: ParamsType;
};

const EditButton = styled.button`
	padding: 3px 0 0 10px;
	border: none;
	background-color: transparent;
	cursor: pointer;

	svg {
		fill: #919eab;
	}
`;

const CorrectWrapper = styled.span`
	position: absolute;
	display: flex;
	align-items: center;
	right: 48px;
	background-color: white;
`;

const Control =
	(openActionDrawerForId: React.Dispatch<React.SetStateAction<string | null>>, alreadyEditing: boolean) =>
	({ children, ...props }: ControlProps<OptionType>) => {
		const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
			e.preventDefault();
			e.stopPropagation();
		};
		const innerProps = { ...props.innerProps, onMouseDown };
		const record = props.getValue()[0]?.record;

		/**
		 * Returns a correct/incorrect indicator based on the `isCorrect` property of the record.
		 * Returns `null` if the record doesn't have an `isCorrect` property.
		 */
		const isCorrectIndicator = () => {
			if (record && "isCorrect" in record) {
				return <CorrectWrapper>{record?.isCorrect ? <Checkmark /> : <Close />}</CorrectWrapper>;
			}
			return null;
		};

		return (
			<components.Control {...props} innerProps={innerProps}>
				{record && (
					<EditButton
						type="button"
						onClick={() => {
							if (!alreadyEditing) openActionDrawerForId(props.getValue()[0]?.id);
						}}
					>
						<Edit />
					</EditButton>
				)}
				{children}
				{isCorrectIndicator()}
			</components.Control>
		);
	};

export default Control;
