import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  CreatedAt, UpdatedAt,
} from "sequelize-typescript";

@Table({ tableName: "admins", underscored: true, timestamps: true })
export class Admin extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  password_hash!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  first_name!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  last_name!: string | null;

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
}

export default Admin;
