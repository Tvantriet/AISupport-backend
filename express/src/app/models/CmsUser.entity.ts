import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	JoinTable,
	ManyToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { DateTime } from "luxon";
import CmsRole from "./CmsRole.entity.js";
import Bcrypt from "../utils/Bcrypt.js";

@Entity("cms_users")
export default class CmsUser extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false, type: "varchar" })
	name: string;

	@Column({ unique: true, nullable: false, type: "varchar" })
	email: string;

	@Column({ nullable: false, type: "varchar" })
	password: string;

	@Column({ nullable: true, type: "varchar" })
	avatar: string;

	@Column({
		name: "password_recovery_token",
		nullable: true,
		type: "varchar",
	})
	passwordRecoveryToken: string;

	@Column({ nullable: true, type: "json" })
	settings: { theme: string; language: string };

	@CreateDateColumn({ name: "created_at", type: "timestamp" })
	createdAt: DateTime;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp" })
	updatedAt: DateTime;

	public static async findByEmail(email: string): Promise<CmsUser | undefined> {
		return (await this.findOne({ where: { email } })) ?? undefined;
	}

	public isValidPassword(password: string): boolean {
		return Bcrypt.check(password, this.password);
	}

	public async getCmsRole(): Promise<string> {
		const cmsRoles = await this.cmsRoles;
		return cmsRoles[0]?.slug;
	}

	@ManyToMany(() => CmsRole, (cmsrole) => cmsrole.cmsUsers, { eager: true })
	@JoinTable({
		name: "cms_user_has_roles",
		joinColumn: {
			name: "cms_user_id",
			referencedColumnName: "id",
		},
		inverseJoinColumn: {
			name: "cms_role_id",
			referencedColumnName: "id",
		},
	})
	cmsRoles: CmsRole[];
}
