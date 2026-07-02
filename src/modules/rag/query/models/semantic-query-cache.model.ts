import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  CreatedAt, ForeignKey,
} from "sequelize-typescript";
import { Company } from "@/modules/companies/company.model";
import { Document } from "@/modules/rag/documents/document.model";

@Table({ tableName: "semantic_query_cache", underscored: true, timestamps: false })
export class SemanticQueryCache extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => Company)
  @Column({ type: DataType.UUID, allowNull: false })
  company_id!: string;

  @ForeignKey(() => Document)
  @Column({ type: DataType.UUID, allowNull: true })
  document_id!: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  question!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  question_embedding!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  answer!: string;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  sources!: object;

  @Column({ type: DataType.INTEGER, defaultValue: 0, allowNull: false })
  hit_count!: number;

  @CreatedAt
  @Column({ field: "created_at" })
  created_at!: Date;

  @Column({ field: "last_used_at", type: DataType.DATE, allowNull: false })
  last_used_at!: Date;
}

export default SemanticQueryCache;
