import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  CreatedAt, ForeignKey,
} from "sequelize-typescript";
import { Company } from "@/modules/companies/company.model";

@Table({ tableName: "query_token_usage", underscored: true, timestamps: false })
export class QueryTokenUsage extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => Company)
  @Column({ type: DataType.UUID, allowNull: false })
  company_id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  query_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  operation_type!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  model!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  embedding_tokens!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  prompt_tokens!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  completion_tokens!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  total_tokens!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  cache_hit!: boolean;

  @CreatedAt
  @Column({ field: "created_at" })
  created_at!: Date;
}

export default QueryTokenUsage;
