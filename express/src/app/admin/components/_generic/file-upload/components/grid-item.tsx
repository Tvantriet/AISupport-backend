import React, { useMemo } from "react";
import { Box } from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import { FileData } from "../../../../views/media/handler.js";

const GridItemWrapper = styled(Box)`
	position: relative;
	box-shadow: 0 0 0 1px #f0f0f0;
	border-radius: 4px;
	transition: box-shadow 0.1s ease-in-out;

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
	onSelect: (fileUrl: string, contentType: string) => void;
};

const GridItem: React.FC<Props> = ({ file, onSelect }) => {
	if (!file) return null;
	const { url, metadata } = file;

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
			<PreviewWrapper height={150} padding={10} onClick={() => onSelect(url, metadata?.contentType)}>
				{preview}
			</PreviewWrapper>
		</GridItemWrapper>
	);
};

export default GridItem;
