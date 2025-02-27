import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("cms_user_has_roles", (table) => {
		table.increments("id");
		table.integer("cms_role_id").unsigned();
		table.foreign("cms_role_id").references("id").inTable("cms_roles").onDelete("SET NULL");
		table.integer("cms_user_id").unsigned();
		table.foreign("cms_user_id").references("id").inTable("cms_users").onDelete("CASCADE");
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("cms_user_has_roles");
}
