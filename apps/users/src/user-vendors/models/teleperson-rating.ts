import { Entity, PrimaryGeneratedColumn, Column,  CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class TelepersonRating  {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    vendorId: number;

    @Column()
    rating: number;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;


}