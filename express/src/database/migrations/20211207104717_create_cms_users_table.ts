import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("cms_users", (table) => {
		table.increments("id");
		table.string("name", 500).notNullable();
		table.string("email", 500).notNullable();
		table.text("avatar").nullable();
		table.string("password", 500).notNullable();
		table.string("password_recovery_token", 255).nullable();
		table.jsonb("settings").nullable().defaultTo({ theme: "light", language: "en" });
		table.timestamp("created_at").defaultTo(knex.fn.now());
		table.timestamp("updated_at").defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("cms_users");
}
