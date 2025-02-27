import React, { useMemo, useState } from "react";
import { Box, CheckBox, Icon, Tooltip } from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import { useTranslation } from "adminjs";
import { FileData } from "../handler.js";
import ItemModal from "./item-modal.js";

const GridItemWrapper = styled(Box)`
	position: relative;
	box-shadow: 0 0 0 1px #f0f0f0;
	border-radius: 4px;
	transition: box-shadow 0.1s ease-in-out;

	&:hover {
		opacity: 1;
	}

	span {
		cursor: pointer;
	}
`;

const PreviewWrapper = styled(Box)`
	position: relative;

	img,
	video {
		display: block;
		height: 100%;
		width: auto;
		margin: auto;
	}
`;

type Props = {
	file: FileData;
	deleteFile: (fileName: string) => void;
	addToBulkDelete: (fileName: string) => void;
};

const GridItem: React.FC<Props> = ({ file, deleteFile, addToBulkDelete }) => {
	const { url, metadata } = file;
	const [showModal, setShowModal] = useState(false);
	const [checked, setChecked] = useState(false);
	const { translateLabel } = useTranslation();

	const preview = useMemo(() => {
		if (!metadata.contentType) {
			return <img src={url} alt={metadata.name} />;
		}
		switch (true) {
			case metadata.contentType.includes("image"):
				return <img src={url} alt={metadata.name} />;
			case metadata.contentType.includes("video"):
				return <video src={url} />;
			default:
				return <img src="/images/file-img.png" alt={metadata.name} />;
		}
	}, [metadata.contentType]);

	return (
		<GridItemWrapper>
			<PreviewWrapper height={150} padding={10} onClick={() => setShowModal(true)}>
				{preview}
			</PreviewWrapper>
			<Box as="span" position="absolute" padding={10} top={0}>
				<CheckBox
					checked={checked}
					onChange={() => {
						setChecked(!checked);
						addToBulkDelete(metadata.name);
					}}
				/>
			</Box>
			<Tooltip direction="bottom" title={translateLabel("Copy url")}>
				<Box
					as="span"
					position="absolute"
					padding={10}
					paddingBottom={0}
					top={0}
					right={0}
					onClick={() => {
						if (!navigator) return;
						navigator.clipboard.writeText(url);
					}}
				>
					<Icon icon="Copy" key="Copy" color="#C0C0CA" />
				</Box>
			</Tooltip>
			{showModal && <ItemModal file={file} deleteFile={deleteFile} close={() => setShowModal(false)} />}
		</GridItemWrapper>
	);
};

export default GridItem;
