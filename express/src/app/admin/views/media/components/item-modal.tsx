import React, { useMemo } from "react";
import { Box, Modal, ModalProps, Button } from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import { useTranslation } from "adminjs";
import format from "date-fns/format";
import { FileData } from "../handler.js";

const ModalWrapper = styled(Modal)`
	@media screen and (min-width: 577px) {
		width: 100%;
		max-width: 750px;
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

const GridDescription = styled(Box)`
	position: relative;
	display: flex;
	border-top: 1px solid #f0f0f0;
	margin-top: 10px;
	padding: 30px 0;

	span {
		margin-right: 10px;
		font-weight: bold;
	}
`;

type Props = {
	file: FileData;
	deleteFile: (fileName: string) => void;
	close: () => void;
};

const ItemModal: React.FC<Props> = ({ file, deleteFile, close }) => {
	const { url, metadata } = file;
	const { translateLabel } = useTranslation();

	const modalProps: ModalProps = {
		variant: "primary",
		label: "Media detail",
		icon: "Classification",
		onClose: close,
		onOverlayClick: close,
	};

	const preview = useMemo(() => {
		if (!metadata.contentType) {
			return <img src={url} alt={metadata.name} />;
		}
		switch (true) {
			case metadata.contentType.includes("image"):
				return <img src={url} alt={metadata.name} />;
			case metadata.contentType.includes("video"):
				return <video src={url} controls />;
			default:
				return <img src="/images/file-img.png" alt={metadata.name} />;
		}
	}, [metadata.contentType]);

	return (
		<ModalWrapper {...modalProps}>
			<PreviewWrapper height={300} padding={10} flex alignItems="center" justifyContent="center">
				{preview}
			</PreviewWrapper>
			<GridDescription>
				<Box width={1 / 2} paddingRight={10} borderRight="1px solid #f0f0f0">
					<p>
						<span>{translateLabel("fileType")}:</span>
						{metadata.contentType}
					</p>
					<p>
						<span>{translateLabel("fileSize")}:</span>
						{Math.round(parseInt(metadata.size, 10) / 1024)} KB
					</p>
					<p>
						<span>{translateLabel("MD5")}:</span>
						{metadata.md5Hash}
					</p>
				</Box>
				<Box width={1 / 2} paddingLeft={10}>
					<p>
						<span>{translateLabel("createdAt")}:</span>
						{format(new Date(metadata.timeCreated), "dd-MM-yyyy HH:mm")}
					</p>
					<p>
						<span>{translateLabel("updatedAt")}:</span>
						{format(new Date(metadata.updated), "dd-MM-yyyy HH:mm")}
					</p>
				</Box>
			</GridDescription>
			<Box marginLeft="auto" width="fit-content">
				<Button
					marginRight={16}
					onClick={() => {
						window.location.href = file.metadata.mediaLink;
					}}
				>
					{translateLabel("download")}
				</Button>
				<Button
					variant="danger"
					onClick={() => {
						deleteFile(metadata.name);
						close();
					}}
				>
					{translateLabel("delete")}
				</Button>
			</Box>
		</ModalWrapper>
	);
};

export default ItemModal;
