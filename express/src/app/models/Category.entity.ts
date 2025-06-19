import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from "typeorm";
import { Product } from "./Product.entity.js";
import { Document } from "./Document.entity.js";

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @ManyToMany(() => Product, product => product.categories)
  products: Product[]; 

  @OneToMany(() => Document, document => document.category)
  documents: Document[];
} 