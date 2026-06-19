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
  HasMany,
} from "sequelize-typescript";
import { User } from "@/modules/users/user.model";

@Table({
  tableName: "tenants",
  underscored: true,
  paranoid: true,
  timestamps: true,
})
export class Tenant extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  slug!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_active!: boolean;

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

  @HasMany(() => User)
  users!: User[];
}

export default Tenant;
