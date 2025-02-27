import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("app_users", (table) => {
		table.increments("id");
		table.text("email").notNullable();
		table.text("email_lookup").notNullable();
		table.text("first_name").notNullable();
		table.text("last_name").nullable();
		table.string("language", 255).notNullable();
		table.json("save_data").nullable();
		table.timestamp("created_at").defaultTo(knex.fn.now());
		table.timestamp("updated_at").defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("app_users");
}
