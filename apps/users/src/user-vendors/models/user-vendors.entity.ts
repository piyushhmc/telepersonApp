import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from "typeorm";
import { AbstractEntity } from '@app/common';


@Entity()
@Unique(['userId', 'vendorId']) // Enforce unique constraint
@Index('idxUserVendor', ['userId', 'vendorId'], { unique: true }) // Create a unique index
export class UserVendors extends AbstractEntity<UserVendors> {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    vendorId: number;

    @Column({nullable: true })
    isPlaidLinked: number;

    @Column({nullable: true })
    plaidLinkedDate: Date;

    @Column()
    assignedDate: Date;

    @Column()
    isActive: boolean;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @Column({nullable: true })
    deletedAt: Date;

    @Column({nullable: true })
    deletedBy: number;

}