import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  CreatedAt, UpdatedAt, HasMany,
} from "sequelize-typescript";
import { User } from "@/modules/users/user.model";
import { Document } from "@/modules/rag/documents/document.model";
import { Chunk } from "@/modules/rag/chunks/chunk.model";

@Table({ tableName: "companies", underscored: true, timestamps: true })
export class Company extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  slug!: string;

  @Column({ type: DataType.JSONB, defaultValue: {} })
  settings!: object;

  @CreatedAt
  @Column({ field: "created_at" })
  created_at!: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updated_at!: Date;

  @Column({ type: DataType.UUID, allowNull: true, field: "created_by" })
  created_by!: string | null;

  @Column({ type: DataType.UUID, allowNull: true, field: "updated_by" })
  updated_by!: string | null;

  @HasMany(() => User)
  users!: User[];

  @HasMany(() => Document)
  documents!: Document[];

  @HasMany(() => Chunk)
  chunks!: Chunk[];
}

export default Company;
