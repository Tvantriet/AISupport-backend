import React from "react";
import { Box } from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import GridItem from "./grid-item.js";
import { FileData } from "../../../../views/media/handler.js";

const ImageGridWrapper = styled(Box)`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	grid-gap: 20px;
`;

type Props = {
	files: FileData[];
	onFileSelect: (fileUrl: string, contentType: string) => void;
};

const ImageGrid: React.FC<Props> = ({ files, onFileSelect }) =>
	files.length ? (
		<ImageGridWrapper>
			{files.length > 0 &&
				files.map((file) => <GridItem key={file?.metadata?.id} file={file} onSelect={onFileSelect} />)}
		</ImageGridWrapper>
	) : null;

export default ImageGrid;
