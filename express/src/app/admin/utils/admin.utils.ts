/* eslint-disable no-await-in-loop */
import { ActionContext, ActionRequest } from "adminjs";
import { EntityManager, ObjectLiteral } from "typeorm";

/**
 * Simple utility functions for adminjs
 *
 */
export const isPOSTMethod = ({ method }: ActionRequest): boolean => method.toLowerCase() === "post";

export const isGETMethod = ({ method }: ActionRequest): boolean => method.toLowerCase() === "get";

export const isNewAction = ({ params: { action } }: ActionRequest): boolean => action === "new";

export const isEditAction = ({ params: { action } }: ActionRequest): boolean => action === "edit";

export const isAdminLevel = ({ currentAdmin }: ActionContext) => currentAdmin?.role === "admin";

export const isEditorLevel = ({ currentAdmin }: ActionContext) =>
	currentAdmin?.role === "admin" || currentAdmin?.role === "editor" || currentAdmin?.editAllowed;

export const isViewerLevel = ({ currentAdmin }: ActionContext) =>
	currentAdmin?.role === "admin" ||
	currentAdmin?.role === "editor" ||
	currentAdmin?.role === "clubEditor" ||
	currentAdmin?.role === "viewer";

/**
 *
 * Make a deep clone of entity with relations
 *
 * @param entity
 * @param qbManager
 * @param relations - specify direct and child relations (append entityname for child relations, example: ["questions", "questions.answers", "answers.images"]),
 * 					  any relations you dont want cloned you can omit from this list, their reference will still be copied
 */
export const cloneEntityWithRelations = async <T extends ObjectLiteral>(
	entity: T,
	qbManager: EntityManager,
	relations: string[],
): Promise<T> => {
	const repo = qbManager.getRepository<T>(entity.constructor.name);
	const { givenTableName } = repo.metadata;
	const targetRelations = relations
		.filter((relation) => relation.includes(`${givenTableName}.`) || !relation.includes("."))
		.map((relation) => {
			const key = relation.split(".");
			return key[1] ?? key[0];
		});

	// Make a deep clone of main entity
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { id, createdAt, updatedAt, ...entityClone } = entity;
	const clonedEntity = Object.assign(repo.create(), entityClone);

	// Clone relations
	for (const relation of targetRelations) {
		const relatedEntities = await qbManager
			.createQueryBuilder()
			.relation(repo.target, relation)
			.of(entity)
			.loadMany();
		// Link cloned entities to the cloned main entity
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(clonedEntity as any)[relation] = await Promise.all(
			relatedEntities.map(async (relatedEntity) =>
				cloneEntityWithRelations(
					relatedEntity,
					qbManager,
					relations.filter((r) => r.includes(".")),
				),
			),
		);
	}

	// Save cloned entity with relations in db
	return qbManager.save(clonedEntity);
};
