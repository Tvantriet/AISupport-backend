import {
	Column,
	CreateDateColumn,
	Entity,
	JoinTable,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
	BaseEntity,
	BeforeInsert,
} from "typeorm";
import { DateTime } from "luxon";
import CmsUser from "./CmsUser.entity.js";
import { AppDataSource } from "../../database/typeorm-db.js";

@Entity("cms_roles")
export default class CmsRole extends BaseEntity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar" })
	slug: string;

	@Column({ type: "varchar" })
	name: string;

	@Column({
		type: "json",
		nullable: true,
	})
	permissions: string;

	@CreateDateColumn({ name: "created_at", type: "timestamp" })
	createdAt: DateTime;

	@UpdateDateColumn({ name: "updated_at", type: "timestamp" })
	updatedAt: DateTime;

	@JoinTable({
		name: "cms_user_has_roles",
		joinColumn: {
			name: "cmsuser_id",
			referencedColumnName: "id",
		},
		inverseJoinColumn: {
			name: "cmsrole_id",
			referencedColumnName: "id",
		},
	})
	cmsUsers: Promise<CmsUser[]>;

	@BeforeInsert()
	private async generateId() {
		if (!this.id) {
			const maxId = await AppDataSource.createQueryBuilder(CmsRole, "role")
				.select("MAX(role.id)", "maxId")
				.getRawOne();

			this.id = (maxId.maxId || 0) + 1;
		}
	}
}
