import React, { useEffect, useRef, useState } from "react";
import { Box, H4, Loader, Label, Select, Icon, Button } from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import { ApiClient, useTranslation } from "adminjs";
import { FileData, MetaData } from "./handler.js";
import FileGrid from "./components/grid.js";

const defaultMetaData = { maxResults: 20, pageToken: null, nextPageToken: null };

const defaultOptions = [
	{ value: 20, label: 20 },
	{ value: 30, label: 30 },
	{ value: 50, label: 50 },
];

const Content = styled(Box)`
	display: ${({ flex }): string => (flex ? "flex" : "block")};
	color: ${({ theme }) => theme.colors.grey100};
	padding: ${({ theme }) => theme.space.xl};
	background-color: ${({ theme }) => theme.colors.container};
	text-decoration: none;
	border: 1px solid transparent;
	border-radius: ${({ theme }) => theme.space.md};
	box-shadow: ${({ theme }) => theme.shadows.card};
`;

export const Media: React.FC = () => {
	const [data, setData] = useState<FileData[] | undefined>(undefined);
	const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const { translateLabel, translateButton } = useTranslation();
	const metaData = useRef<MetaData>(defaultMetaData);
	const gridRef = useRef<HTMLElement>(null);
	const blockCalls = useRef(false);

	/**
	 * Fetches media files data from the API.
	 * @async
	 * @function
	 * @param {MetaData} params - The params to send to the API.
	 */
	const fetchData = async (params: MetaData) => {
		if (!params?.maxResults || blockCalls.current) return;
		setLoading(true);
		try {
			const api = new ApiClient();
			blockCalls.current = true;
			const response: any = await api.getPage({ pageName: "media", params });

			if (response.data) {
				let { fileData } = response.data;
				const { responseMetadata } = response.data;
				if (!Array.isArray(fileData)) fileData = [fileData];
				setData((curr) => (curr ? [...curr, ...fileData] : [...fileData]));

				setLoading(false);
				metaData.current = responseMetadata;
				blockCalls.current = false;
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.warn(err);
		}
	};

	/**
	 * Deletes media files data from the API.
	 * @async
	 * @function
	 * @param {Record<string, string[]>} params - The params to send to the API.
	 */
	const deleteData = async (params: Record<string, string[]>) => {
		try {
			const api = new ApiClient();
			await api.getPage({ pageName: "media", params });

			setData(data?.filter(({ metadata }) => !params.filesToDelete.includes(metadata.name)));
		} catch (err) {
			// eslint-disable-next-line no-console
			console.warn(err);
		}
	};

	/**
	 * Handles the scroll event to load more media files data.
	 * @function
	 */
	const handleScroll = () => {
		if (gridRef?.current && !loading) {
			const { bottom } = gridRef.current.getBoundingClientRect();
			if (bottom <= window.innerHeight) fetchData(metaData.current);
		}
	};

	/**
	 * Fetches media files data when the component mounts.
	 * @function
	 */
	useEffect(() => {
		if (data === undefined && !loading) {
			fetchData(metaData.current);
		}
	}, [data]);

	/**
	 * Adds a scroll event listener to load more media files data when the user scrolls to the bottom of the page.
	 * @function
	 */
	useEffect(() => {
		window.addEventListener("scroll", handleScroll, { capture: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [metaData]);

	return (
		<Content m="xl">
			<Box flex alignItems="center">
				<Icon size={32} icon="File" />
				<H4>{translateLabel("mediaGallery")}</H4>
				<Box width="fit-content" marginTop="-24px" marginLeft="auto" marginRight={16}>
					<Label>{translateLabel("results")}</Label>
					<Select
						isClearable={false}
						isSearchable={false}
						options={defaultOptions}
						value={{ label: metaData.current?.maxResults, value: metaData.current?.maxResults }}
						onChange={({ value }) => {
							metaData.current = { ...defaultMetaData, maxResults: value };
							setData(undefined);
						}}
					/>
				</Box>
				<Button
					variant="danger"
					disabled={filesToDelete.length <= 0}
					onClick={() => deleteData({ filesToDelete })}
				>
					{translateButton("bulkDelete")}
				</Button>
			</Box>
			{data && (
				<Box ref={gridRef} width={1} marginBottom={16}>
					<FileGrid files={data ?? []} filesToDelete={setFilesToDelete} deleteFile={deleteData} />
				</Box>
			)}
			{loading && <Loader />}
		</Content>
	);
};

export default Media;
