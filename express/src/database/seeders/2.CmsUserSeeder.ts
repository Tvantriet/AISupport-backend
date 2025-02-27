import { Knex } from "knex";
import crypto from "crypto";
import Bcrypt from "../../app/utils/Bcrypt.js";
export async function seed(knex: Knex): Promise<void> {
	// Inserts seed entries
	const randomPassword = crypto.randomBytes(20).toString("hex");
	await knex("cms_users").insert([
		{
			id: 1,
			name: "Livewall Admin",
			email: "info@livewallgroup.com",
			password: Bcrypt.make(randomPassword),
		},
	]);
}
