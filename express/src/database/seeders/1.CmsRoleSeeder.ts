import { Knex } from "knex";
export async function seed(knex: Knex): Promise<void> {
	// Inserts seed entries
	await knex("cms_roles").insert([
		{
			id: 1,
			slug: "user",
			name: "User",
			permissions: JSON.stringify({
				"platform.index": "1",
				"platform.systems.index": "0",
				"platform.systems.roles": "0",
				"platform.systems.users": "0",
				"platform.systems.attachment": "1",
			}),
		},
		{
			id: 2,
			slug: "admin",
			name: "Administrator",
			permissions: JSON.stringify({
				"platform.index": "1",
				"platform.systems.index": "0",
				"platform.systems.roles": "0",
				"platform.systems.users": "0",
				"platform.systems.attachment": "1",
			}),
		},
	]);
}
