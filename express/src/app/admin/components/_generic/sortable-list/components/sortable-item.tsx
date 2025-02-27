import React, { createContext, useMemo } from "react";
import type { CSSProperties, PropsWithChildren } from "react";
import type { DraggableSyntheticListeners, UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { Transform, CSS } from "@dnd-kit/utilities";

import { Draggable, TrashCan } from "@carbon/icons-react";
import { styled } from "@adminjs/design-system/styled-components";

interface Props {
	id: UniqueIdentifier;
	onRemove: (id: UniqueIdentifier) => void;
}

interface Context {
	attributes: Record<string, any>;
	listeners: DraggableSyntheticListeners;
	ref(node: HTMLElement | null): void;
}

const SortableItemContext = createContext<Context>({
	attributes: {},
	listeners: undefined,
	ref() {
		null;
	},
});

const ListItem = styled.li((props: { transform: Transform | null; transition: string | undefined }) => ({
	transform: CSS.Transform.toString(props.transform),
	transition: props.transition,
	display: "flex",
	alignItem: "center",
	backgroundColor: "white",
	border: "1px solid #C0C0CA",
	borderRadius: "6px",
	padding: "15px 0",
	margin: "15px auto",
}));

const ListButton = styled.button`
	display: flex;
	align-items: center;
	border: none;
	padding: 0 20px;
	background-color: transparent;
	cursor: grab;

	svg {
		fill: #919eab;
	}

	@media only screen and (max-width: 620px) {
		padding: 0 14px !important;
	}
`;

const RemoveButton = styled(ListButton)`
	cursor: pointer;

	svg {
		fill: #919eab;
		&:hover {
			fill: red;
		}
	}
`;

export function SortableItem({ children, id, onRemove }: PropsWithChildren<Props>) {
	const { attributes, isDragging, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({
		id,
	});
	const context = useMemo(
		() => ({
			attributes,
			listeners,
			ref: setActivatorNodeRef,
		}),
		[attributes, listeners, setActivatorNodeRef],
	);

	const removeItem = () => {
		onRemove(id);
	};

	const style: CSSProperties = {
		opacity: isDragging ? 0.4 : undefined,
		transform: CSS.Translate.toString(transform),
		transition,
	};

	const childrenContainerStyle = {
		width: "100%",
	};

	return (
		<SortableItemContext.Provider value={context}>
			<ListItem ref={setNodeRef} transform={transform} transition={transition} style={style}>
				<ListButton {...attributes} {...listeners} type="button">
					<Draggable />
				</ListButton>
				<div style={childrenContainerStyle}>{children}</div>
				<RemoveButton onClick={removeItem} type="button">
					<TrashCan />
				</RemoveButton>
			</ListItem>
		</SortableItemContext.Provider>
	);
}
