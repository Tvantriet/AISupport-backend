import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Document } from "./Document.entity.js";
import { Category } from "./Category.entity.js";

@Entity('products')
export class Product {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  product_name: string;

  @Column({ type: "varchar", nullable: true })
  image_url: string;

  @Column({ type: "varchar", nullable: true })
  image_key: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "boolean", default: false })
  hidden: boolean;

  @ManyToMany(() => Category, category => category.products)
  @JoinTable({
      name: "product_categories",
      joinColumn: {
          name: "product_id",
          referencedColumnName: "id"
      },
      inverseJoinColumn: {
          name: "category_id",
          referencedColumnName: "id"
      }
  })
  categories: Category[]; 

  @OneToMany(() => Document, Document => Document.product)
  documents: Document[];
} 