import { Knex } from "knex";
export async function seed(knex: Knex): Promise<void> {
	// Inserts seed entries
	await knex("cms_user_has_roles").insert([
		{
			id: 1,
			cms_role_id: 2,
			cms_user_id: 1,
		},
	]);
}
