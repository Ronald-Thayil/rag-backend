import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  CreatedAt, UpdatedAt, DeletedAt, ForeignKey, BelongsTo,
} from "sequelize-typescript";
import { Tenant } from "@/modules/tenants/tenant.model";

@Table({ tableName: "documents", underscored: true, paranoid: true, timestamps: true })
export class Document extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id!: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  title!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  content!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  file_path!: string | null;

  @Column({ type: DataType.STRING(50), allowNull: true })
  file_type!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  file_size!: number | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  metadata!: object | null;

  @CreatedAt @Column({ field: "created_at" }) created_at!: Date;
  @UpdatedAt @Column({ field: "updated_at" }) updated_at!: Date;
  @DeletedAt @Column({ field: "deleted_at" }) deleted_at!: Date | null;
  @Column({ type: DataType.UUID, allowNull: true, field: "created_by" }) created_by!: string | null;
  @Column({ type: DataType.UUID, allowNull: true, field: "updated_by" }) updated_by!: string | null;
  @Column({ type: DataType.UUID, allowNull: true, field: "deleted_by" }) deleted_by!: string | null;

  @BelongsTo(() => Tenant) tenant!: Tenant;
}

export default Document;
