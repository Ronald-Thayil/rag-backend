import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  CreatedAt, UpdatedAt, BelongsTo, ForeignKey,
} from "sequelize-typescript";
import { Company } from "@/modules/companies/company.model";
import { Document } from "@/modules/rag/documents/document.model";

@Table({ tableName: "chunks", underscored: true, timestamps: true })
export class Chunk extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => Company)
  @Column({ type: DataType.UUID, allowNull: false })
  company_id!: string;

  @ForeignKey(() => Document)
  @Column({ type: DataType.UUID, allowNull: false })
  document_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  content!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  embedding!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false })
  chunk_index!: number;

  @Column({ type: DataType.JSONB, defaultValue: {} })
  metadata!: object;

  @Column({ type: DataType.INTEGER, allowNull: true })
  token_count!: number | null;

  @CreatedAt
  @Column({ field: "created_at" })
  created_at!: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updated_at!: Date;

  @BelongsTo(() => Company)
  company!: Company;

  @BelongsTo(() => Document)
  document!: Document;
}

export default Chunk;
