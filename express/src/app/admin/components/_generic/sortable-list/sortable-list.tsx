import React, { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { Active, UniqueIdentifier } from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslation } from "adminjs";
import { Button } from "@adminjs/design-system";
import { AddAlt } from "@carbon/icons-react";
import { SortableItem } from "./components/sortable-item.js";
import { SortableOverlay } from "./components/sortable-overlay.js";

interface BaseItem {
	id: UniqueIdentifier;
}

interface Props<T extends BaseItem> {
	items: T[];
	onChange(items: T[]): void;
	renderItem(item: T): ReactNode;
	allowCreateMore?: boolean;
}

export function SortableList<T extends BaseItem>({ items, onChange, renderItem, allowCreateMore }: Props<T>) {
	const { translateLabel } = useTranslation();
	const [active, setActive] = useState<Active | null>(null);
	const activeItem = useMemo(() => items.find((item) => item.id === active?.id), [active, items]);
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const createEmptyField = () => {
		// Create a placeholder field
		onChange([...items, { id: "empty" } as T]);
	};

	const handleRemove = (id: UniqueIdentifier) => {
		onChange(items.filter((item) => item.id !== id));
	};

	return (
		<DndContext
			sensors={sensors}
			onDragStart={({ active }) => {
				setActive(active);
			}}
			onDragEnd={({ active, over }) => {
				if (over && active.id !== over?.id) {
					const activeIndex = items.findIndex(({ id }) => id === active.id);
					const overIndex = items.findIndex(({ id }) => id === over.id);

					onChange(arrayMove(items, activeIndex, overIndex));
				}
				setActive(null);
			}}
			onDragCancel={() => {
				setActive(null);
			}}
		>
			<SortableContext items={items} strategy={verticalListSortingStrategy}>
				<ul style={{ listStyle: "none" }}>
					{items.map((item) => (
						<SortableItem key={item.id} id={item.id} onRemove={handleRemove}>
							{renderItem(item)}
						</SortableItem>
					))}
					{allowCreateMore && (
						<Button
							style={{ display: "flex", alignItems: "center" }}
							type="button"
							onClick={createEmptyField}
						>
							<AddAlt style={{ marginRight: "10px" }} />
							{translateLabel("AddNewField")}
						</Button>
					)}
				</ul>
			</SortableContext>
			<SortableOverlay>
				{activeItem ? (
					<SortableItem id={activeItem.id} onRemove={handleRemove}>
						{renderItem(activeItem)}
					</SortableItem>
				) : null}
			</SortableOverlay>
		</DndContext>
	);
}

SortableList.Item = SortableItem;
