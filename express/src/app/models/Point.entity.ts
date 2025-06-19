import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";

/**
 * Represents a data point or vector associated with a document.
 */
@Entity('points')
export class Point {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  document_id: string;

  @ManyToOne("Document", { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: any;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int' })
  index: number;

  @Column({
    type: <any>"vector",
    transformer: {
      to: (value: number[]) => `[${value.join(',')}]`, // format for pgvector
      from: (value: string) => value.match(/-?\d+(\.\d+)?/g)?.map(Number) || []
    },
    length: 1536,
    nullable: false
  })
  @Index("point_embedding_hnsw_idx", { synchronize: false })
  embedding: number[];
} 