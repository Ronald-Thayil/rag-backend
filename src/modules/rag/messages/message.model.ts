import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  CreatedAt, UpdatedAt, DeletedAt, ForeignKey, BelongsTo,
} from "sequelize-typescript";
import { Tenant } from "@/modules/tenants/tenant.model";
import { Conversation } from "@/modules/rag/conversations/conversation.model";

@Table({ tableName: "messages", underscored: true, paranoid: true, timestamps: true })
export class Message extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => Conversation)
  @Column({ type: DataType.UUID, allowNull: false })
  conversation_id!: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id!: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  role!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  content!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  metadata!: object | null;

  @CreatedAt @Column({ field: "created_at" }) created_at!: Date;
  @UpdatedAt @Column({ field: "updated_at" }) updated_at!: Date;
  @DeletedAt @Column({ field: "deleted_at" }) deleted_at!: Date | null;
  @Column({ type: DataType.UUID, allowNull: true, field: "created_by" }) created_by!: string | null;
  @Column({ type: DataType.UUID, allowNull: true, field: "updated_by" }) updated_by!: string | null;
  @Column({ type: DataType.UUID, allowNull: true, field: "deleted_by" }) deleted_by!: string | null;

  @BelongsTo(() => Conversation) conversation!: Conversation;
  @BelongsTo(() => Tenant) tenant!: Tenant;
}

export default Message;
