import React from "react";
import { Box } from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import GridItem from "./grid-item.js";
import { FileData } from "../handler.js";

const ImageGridWrapper = styled(Box)`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	grid-gap: 20px;
`;

type Props = {
	files: FileData[];
	deleteFile: ({ filesToDelete }: Record<string, string[]>) => void;
	filesToDelete: React.Dispatch<React.SetStateAction<string[]>>;
};

const ImageGrid: React.FC<Props> = ({ files, filesToDelete, deleteFile }) => {
	/**
	 * Adds a file to the bulk delete list
	 * @param {string} fileName - The name of the file to add to the bulk delete list
	 */
	const addToBulkDelete = (fileName: string) => {
		filesToDelete((curr) => {
			const updated = [...curr];
			const name = updated.find((name) => name === fileName);
			if (name) {
				return updated.filter((name) => name !== fileName);
			}
			updated.push(fileName);
			return updated;
		});
	};

	/**
	 * Deletes a single file
	 * @param {string} fileName - The name of the file to delete
	 */
	const deleteSingleFile = (fileName: string) => {
		deleteFile({ filesToDelete: [fileName] });
	};

	return (
		<ImageGridWrapper>
			{files.map((file) => (
				<GridItem
					key={file?.metadata.id}
					file={file}
					addToBulkDelete={addToBulkDelete}
					deleteFile={deleteSingleFile}
				/>
			))}
		</ImageGridWrapper>
	);
};

export default ImageGrid;
