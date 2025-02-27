import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DateTime } from "luxon";
import Crypt from "../utils/Crypt.js";
import Hash from "../utils/Hash.js";

@Entity("app_users")
export default class AppUser extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false, transformer: Crypt.encryptColumn(), type: "varchar" })
	email: string;

	@Column({ name: "email_lookup", nullable: false, type: "varchar" })
	emailLookup: string;

	@Column({ name: "first_name", nullable: false, transformer: Crypt.encryptColumn(), type: "varchar" })
	firstName: string;

	@Column({ name: "last_name", nullable: true, transformer: Crypt.encryptColumn(), type: "varchar" })
	lastName: string;

	@Column({ nullable: false, type: "varchar" })
	language: string;

	@Column({
		name: "save_data",
		type: "json",
	})
	saveData: object;

	@CreateDateColumn({ name: "created_at", type: "timestamp" })
	createdAt: DateTime;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp" })
	updatedAt: DateTime;

	public static async findByEmail(email: string): Promise<AppUser | undefined> {
		const searchHash = Hash.make(email);
		return (await this.findOne({ where: { emailLookup: searchHash } })) ?? undefined;
	}
}
