import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Product } from "./Product.entity.js";
import { Category } from "./Category.entity.js";
import { Point } from "./Point.entity.js";

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { nullable: true })
  product_id: string;

  @ManyToOne(() => Product, product => product.documents,
    {
      onDelete: 'CASCADE',
      nullable: true
    }
  )
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @Column("uuid", { nullable: true })
  category_id: string;

  @ManyToOne(() => Category, category => category.documents,
    {
      onDelete: 'CASCADE',
      nullable: true
    }
  )
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int', nullable: true })
  size: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date_added: Date;

  @Column({ type: 'varchar', nullable: true })
  file_type: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @OneToMany(() => Point, point => point.document, { cascade: true, onDelete: 'CASCADE' })
  vectorPoints: Point[];

} 