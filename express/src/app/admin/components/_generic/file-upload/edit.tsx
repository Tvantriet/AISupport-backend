/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-shadow, @typescript-eslint/no-shadow */
import React, { useState, useEffect, useRef } from "react";
import { DropZone, DropZoneItem, FormGroup, Label, Button, Box } from "@adminjs/design-system";
import { BasePropertyProps, ParamsType, useTranslation } from "adminjs";
import { unflatten } from "flat";
import { styled } from "@adminjs/design-system/styled-components";
import ItemModal from "./components/item-modal.js";

type CombinedPropertyProps = BasePropertyProps & {
	fileUrl?: string;
	nestedPath?: string;
	[key: string]: unknown;
};

const StyledButton = styled(Button)`
	position: absolute;
	margin: auto;
	bottom: 12px;
	padding: 4px 10px;
	left: 0;
	right: 0;
	width: fit-content;
`;

const StyledDropZone = styled(DropZone)`
	padding-bottom: 50px;
	button {
		margin-left: auto;
	}
`;

const DropZoneInput: React.FC<CombinedPropertyProps> = (props) => {
	const { property, record, onChange, fileUrl, nestedPath, label } = props;
	const [showModal, setShowModal] = useState(false);
	const [url, setUrl] = useState<string | null>(
		fileUrl ?? (unflatten<ParamsType, Record<string, unknown>>(record?.params ?? {})[property.path] as string),
	);
	const { translateButton } = useTranslation();
	const inputRef: any = useRef<HTMLElement>(null);
	const buttonRef: any = useRef<HTMLButtonElement>(null);
	const path = nestedPath ? `${property.path}.${nestedPath}` : property.path;

	useEffect(() => {
		if (!inputRef.current || !buttonRef.current) return;
		const inputContainer = inputRef.current ? inputRef.current.querySelector("input")?.parentElement : null;
		if (inputContainer) {
			const top = inputContainer.clientHeight - 44;
			const title = inputContainer.nextElementSibling?.querySelector("section");
			const removeButton = inputContainer.nextElementSibling?.querySelector("button");
			// Apply some styles
			if (removeButton) removeButton.style.marginLeft = "auto";
			title?.remove();
			buttonRef.current.style.top = `${top}px`;
			buttonRef.current.style.bottom = "unset";
		}
	}, [inputRef.current?.clientHeight, path]);

	/**
	 * Callback function that handles the selection of a file from the modal
	 * @param {string} fileUrl - The URL of the selected file
	 * @param contentType
	 * @returns {void}
	 */
	const handleSelect = (fileUrl: string, contentType: string): void => {
		setUrl(() => {
			setShowModal(false);
			return fileUrl;
		});
		onChange?.(path, fileUrl);
		onChange?.("media_type", contentType);
	};

	/**
	 * Callback function that handles the upload of a file to the dropzone
	 * @param {File[]} files - The files being uploaded
	 * @returns {void}
	 */
	const onUpload = async (files: File[]): Promise<void> => {
		// @ts-ignore
		const reader = new FileReader();
		const file = files[0];

		if (!file) return;
		reader.readAsDataURL(file as unknown as Blob);
		reader.onload = () => {
			const base64String = reader.result;
			onChange?.(path, `${file.name};${base64String}`);
			onChange?.("media_type", file.type);
		};
	};

	const clearInput = () => {
		onChange?.(path, null);
		onChange?.("media_type", null);
		setUrl(null);
	};

	return (
		<FormGroup>
			<Label required={property.isRequired}>{(label as string) ?? property?.label}</Label>
			{url ? (
				<DropZoneItem src={url} onRemove={clearInput} />
			) : (
				<Box position="relative" ref={inputRef}>
					<StyledDropZone {...props} onChange={onUpload} />
					<StyledButton type="button" ref={buttonRef} onClick={() => setShowModal(true)}>
						{translateButton("chooseFromGallery")}
					</StyledButton>
				</Box>
			)}
			{showModal && <ItemModal fetchType="media" onSelect={handleSelect} close={() => setShowModal(false)} />}
		</FormGroup>
	);
};

export default DropZoneInput;
