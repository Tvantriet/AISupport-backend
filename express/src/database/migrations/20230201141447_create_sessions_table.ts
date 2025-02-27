import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("session", (table) => {
		table.string("id").primary();
		table.text("json").notNullable();
		table.bigInteger("expired_at").notNullable();
		table.timestamp("deleted_at").nullable();
		table.index(["expired_at"]);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("session");
}
