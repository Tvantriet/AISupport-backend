import React from "react";
import { Box, FormGroup, FormMessage, Label, Tooltip, Icon } from "@adminjs/design-system";
import { BasePropertyProps } from "adminjs";
import { styled } from "@adminjs/design-system/styled-components";

const SwitchWrapper = styled(Box)`
	position: relative;
	width: 75px;
	display: inline-block;
	vertical-align: middle;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	text-align: left;

	.checkbox {
		display: none;
	}

	.label {
		display: block;
		overflow: hidden;
		cursor: pointer;
		border: 0 solid #bbb;
		border-radius: 20px;
		margin: 0;
	}
	.label-inner {
		display: block;
		width: 200%;
		margin-left: -100%;
		transition: margin 0.3s ease-in 0s;
		&:before,
		&:after {
			display: block;
			float: left;
			width: 50%;
			height: 28px;
			padding: 0;
			line-height: 29px;
			font-size: 14px;
			color: white;
			font-weight: bold;
			box-sizing: border-box;
		}
		&:before {
			content: "Yes";
			text-transform: uppercase;
			padding-left: 10px;
			background-color: #70c9b0;
			color: #fff;
		}
	}

	.label-inner:after {
		content: "No";
		text-transform: uppercase;
		padding-right: 10px;
		background-color: #c0c0ca;
		color: #fff;
		text-align: right;
	}

	.label-switch {
		display: block;
		width: 20px;
		margin: 5px;
		background: #fff;
		position: absolute;
		top: 0;
		bottom: 0;
		right: 45px;
		border: 0 solid #bbb;
		border-radius: 20px;
		transition: all 0.3s ease-in 0s;
	}

	.label-inner-checked {
		margin-left: 0;
	}
	.label-switch-checked {
		right: 0;
	}
`;

const ToggleEdit = (props: BasePropertyProps) => {
	const { onChange, property, record } = props;

	const { resourceId } = property;

	if (!resourceId) {
		throw new Error(`Cannot reference resource in property '${property.path}'`);
	}

	const error = record?.errors[property.path];

	return (
		<FormGroup error={Boolean(error)}>
			<Label>
				{property.label}
				{property?.description && (
					<Box mx="sm" display="inline-flex">
						<Tooltip key="translate" direction="bottom" title={property.description}>
							<Box>
								<Icon icon="HelpCircle" color="info" />
							</Box>
						</Tooltip>
					</Box>
				)}
			</Label>
			<SwitchWrapper>
				<input
					type="checkbox"
					className="checkbox"
					id={property.path}
					disabled={property.isDisabled}
					checked={record?.params[property.path]}
					onChange={(e) => onChange?.(property.path, e.target.checked)}
				/>
				<label className="label" htmlFor={property.path}>
					<span className={`label-inner ${record?.params[property.path] ? "label-inner-checked" : ""}`} />
					<span className={`label-switch ${record?.params[property.path] ? "label-switch-checked" : ""}`} />
				</label>
			</SwitchWrapper>
			<FormMessage>{error?.message}</FormMessage>
		</FormGroup>
	);
};

export default ToggleEdit;
