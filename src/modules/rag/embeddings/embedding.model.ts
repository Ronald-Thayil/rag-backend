import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  CreatedAt, UpdatedAt, DeletedAt, ForeignKey, BelongsTo,
} from "sequelize-typescript";
import { Tenant } from "@/modules/tenants/tenant.model";
import { DocumentChunk } from "@/modules/rag/chunks/document-chunk.model";

@Table({ tableName: "embeddings", underscored: true, paranoid: true, timestamps: true })
export class Embedding extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => DocumentChunk)
  @Column({ type: DataType.UUID, allowNull: false })
  chunk_id!: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  embedding!: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  model!: string | null;

  @CreatedAt @Column({ field: "created_at" }) created_at!: Date;
  @UpdatedAt @Column({ field: "updated_at" }) updated_at!: Date;
  @DeletedAt @Column({ field: "deleted_at" }) deleted_at!: Date | null;
  @Column({ type: DataType.UUID, allowNull: true, field: "created_by" }) created_by!: string | null;
  @Column({ type: DataType.UUID, allowNull: true, field: "updated_by" }) updated_by!: string | null;
  @Column({ type: DataType.UUID, allowNull: true, field: "deleted_by" }) deleted_by!: string | null;

  @BelongsTo(() => DocumentChunk) chunk!: DocumentChunk;
  @BelongsTo(() => Tenant) tenant!: Tenant;
}

export default Embedding;
