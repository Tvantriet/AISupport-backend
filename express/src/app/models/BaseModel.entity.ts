import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm";

@Entity()
export default class BaseModel extends BaseEntity {
	@PrimaryColumn({ type: "varchar" })
	id: string;

	@Column({ type: "timestamp" })
	created_at: string;

	@Column({ type: "timestamp" })
	updated_at: string;

	@Column({ type: "varchar" })
	queue_stamp: string;
}
