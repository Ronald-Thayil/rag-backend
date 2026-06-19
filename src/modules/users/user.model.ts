import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import { Tenant } from "@/modules/tenants/tenant.model";

@Table({
  tableName: "users",
  underscored: true,
  paranoid: true,
  timestamps: true,
})
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  first_name!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  last_name!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  email!: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  phone!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  password_hash!: string | null;

  @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: "USER" })
  role!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_active!: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  last_login_at!: Date | null;

  @CreatedAt
  @Column({ field: "created_at" })
  created_at!: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updated_at!: Date;

  @DeletedAt
  @Column({ field: "deleted_at" })
  deleted_at!: Date | null;

  @Column({ type: DataType.UUID, allowNull: true, field: "created_by" })
  created_by!: string | null;

  @Column({ type: DataType.UUID, allowNull: true, field: "updated_by" })
  updated_by!: string | null;

  @Column({ type: DataType.UUID, allowNull: true, field: "deleted_by" })
  deleted_by!: string | null;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;
}

export default User;
