import React, { MouseEventHandler } from "react";
import { Button } from "@adminjs/design-system";
import { useTranslation } from "adminjs";
import { components, MenuListProps } from "react-select";
import { AddAlt } from "@carbon/icons-react";
import { OptionType } from "./control.js";

const MenuList =
	(enableCreateButton: boolean, openActionDrawerForId: React.Dispatch<React.SetStateAction<string | null>>) =>
	(props: MenuListProps<OptionType, false>) => {
		const { translateLabel } = useTranslation();
		const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
			e.preventDefault();
			e.stopPropagation();
		};
		const innerProps = { ...props.innerProps, onMouseDown };

		return (
			<div>
				{enableCreateButton && (
					<Button
						style={{ display: "flex", alignItems: "center", margin: "10px" }}
						type="button"
						onClick={() => openActionDrawerForId("empty")}
					>
						<AddAlt style={{ marginRight: "10px" }} />
						{translateLabel("AddNewOption")}
					</Button>
				)}
				<components.MenuList {...props} innerProps={innerProps} />
			</div>
		);
	};

export default MenuList;
