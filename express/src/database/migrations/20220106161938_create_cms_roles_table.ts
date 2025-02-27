import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("cms_roles", (table) => {
		table.increments("id");
		table.string("slug").notNullable().unique();
		table.string("name").notNullable();
		table.jsonb("permissions").nullable();
		table.timestamp("created_at").defaultTo(knex.fn.now());
		table.timestamp("updated_at").defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("cms_roles");
}
