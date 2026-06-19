import {
  Table, Column, Model, DataType, PrimaryKey, Default, CreatedAt,
} from "sequelize-typescript";

@Table({ tableName: "refresh_tokens", underscored: true, timestamps: true })
export class RefreshToken extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  token_hash!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  subject_id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  subject_type!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  expires_at!: Date;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  revoked!: boolean;

  @CreatedAt
  @Column({ field: "created_at" })
  created_at!: Date;
}

export default RefreshToken;
