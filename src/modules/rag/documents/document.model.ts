import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  CreatedAt, UpdatedAt, BelongsTo, ForeignKey,
} from "sequelize-typescript";
import { Company } from "@/modules/companies/company.model";
import { User } from "@/modules/users/user.model";

@Table({ tableName: "documents", underscored: true, timestamps: true })
export class Document extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => Company)
  @Column({ type: DataType.UUID, allowNull: false })
  company_id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  uploaded_by!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  filename!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  original_filename!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  file_type!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  file_size_bytes!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  storage_path!: string;

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: "processing" })
  status!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  error_message!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  raw_text!: string | null;

  @Column({ type: DataType.JSONB, defaultValue: {} })
  metadata!: object;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  chunk_count!: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  page_count!: number | null;

  @Column({ type: "TIMESTAMPTZ", allowNull: true })
  completed_at!: Date | null;

  @CreatedAt
  @Column({ field: "created_at" })
  created_at!: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updated_at!: Date;

  @BelongsTo(() => Company)
  company!: Company;

  @BelongsTo(() => User)
  uploader!: User;
}

export default Document;
