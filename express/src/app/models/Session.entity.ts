import { ISession } from "connect-typeorm";
import { BaseEntity, Column, DeleteDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("session")
export default class Session extends BaseEntity implements ISession {
	@PrimaryColumn({ type: "varchar" })
	public id: string;

	@Column({ type: "text", transformer: Session.parseUserId() })
	public json = "";

	@Index()
	@Column({ name: "expired_at", type: "bigint" })
	public expiredAt = Date.now();

	@DeleteDateColumn({ name: "deleted_at" })
	public destroyedAt?: Date;

	public static parseUserId() {
		return {
			to: (value: string) => {
				const jsonData = JSON.parse(value);

				return JSON.stringify({
					cookie: jsonData.cookie,
					adminUser: {
						id: jsonData.adminUser?.id ?? null,
						email: jsonData.adminUser?.email ?? null,
						role: jsonData.adminUser?.role ?? null,
					},
				});
			},
			from: (value: string) => value,
		};
	}

	public static async updateUserRole(userId: string, role: string) {
		const session = await this.createQueryBuilder("session")
			.where("JSON_EXTRACT(session.json, '$.adminUser.id') = :userId", { userId: parseInt(userId, 10) })
			.andWhere("session.deleted_at IS NULL")
			.getOne();

		if (!session) {
			return;
		}
		const json = JSON.parse(session.json);
		await Session.update(
			{ id: session.id },
			{ json: JSON.stringify({ ...json, adminUser: { ...json.adminUser, role } }) },
		);
	}
}
