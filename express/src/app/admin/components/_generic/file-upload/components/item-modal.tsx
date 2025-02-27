import React, { useEffect, useRef, useState } from "react";
import { Box, Modal, ModalProps, Loader } from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import { ApiClient, useTranslation } from "adminjs";
import { MetaData, FileData } from "../../../../views/media/handler.js";
import FileGrid from "./grid.js";

const ModalWrapper = styled(Modal)`
	@media screen and (min-width: 577px) {
		width: 100%;
		max-width: 750px;

		section {
			scroll-behavior: smooth;
		}
	}
`;

const defaultMetaData = { maxResults: 20, pageToken: null, nextPageToken: null };

type Props = {
	fetchType: string;
	extraParams?: object;
	onSelect: (fileUrl: string, contentType: string) => void;
	close: () => void;
};

const ItemModal: React.FC<Props> = ({ fetchType, extraParams = {}, onSelect, close }) => {
	const [data, setData] = useState<FileData[] | undefined>(undefined);
	const [loading, setLoading] = useState(false);
	const { translateLabel } = useTranslation();
	const metaData = useRef<MetaData>(defaultMetaData);
	const gridRef: any = useRef<HTMLElement>(null);
	const blockCalls = useRef(false);
	const scrollPos = useRef(0);

	const modalProps: ModalProps = {
		variant: "primary",
		label: translateLabel("mediaGallery"),
		icon: "Folder",
		onClose: close,
		onOverlayClick: close,
	};

	/**
	 * Fetches media files data from the API.
	 * @async
	 * @function
	 * @param {MetaData} params - The params to send to the API.
	 */
	const fetchData = async (params: MetaData) => {
		if (!params.maxResults || blockCalls.current) return;
		setLoading(true);
		try {
			const api = new ApiClient();
			blockCalls.current = true;
			const response: any = await api.getPage({
				pageName: fetchType,
				params: {
					...params,
					...extraParams,
				},
			});

			if (response.data) {
				const { fileData, responseMetadata } = response.data;
				setData((curr) => (curr ? [...curr, ...fileData] : [...fileData]));
				metaData.current = responseMetadata;
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.warn(err);
		} finally {
			setLoading(false);
			blockCalls.current = false;
		}
	};

	/**
	 * Handles the scroll event to load more media files data.
	 * @function
	 */
	const handleScroll = () => {
		if (gridRef?.current && !loading) {
			const { scrollTop, scrollHeight, clientHeight } = gridRef.current;
			if (scrollTop === scrollHeight - clientHeight) {
				scrollPos.current = gridRef.current?.scrollTop;
				fetchData(metaData.current);
			}
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
		// Keep scroll position when fetching new media.
		if (gridRef.current) gridRef.current.scrollTop = scrollPos.current;
	}, [data]);

	return (
		<ModalWrapper {...modalProps}>
			<Box ref={gridRef} height="100%" overflowY="scroll" onScroll={handleScroll} padding={16} maxHeight={500}>
				<FileGrid files={data ?? []} onFileSelect={onSelect} />
				{loading && <Loader />}
			</Box>
		</ModalWrapper>
	);
};

export default ItemModal;
