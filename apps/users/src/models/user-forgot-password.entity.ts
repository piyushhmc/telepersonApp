import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert,  CreateDateColumn, UpdateDateColumn } from "typeorm";
import { AbstractEntity } from '@app/common';

@Entity()
export class ForgotPassword extends AbstractEntity<ForgotPassword> {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    token: string;

    @Column()
    expiryDate: Date;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    emailToLowerCase() {
        this.email = this.email.toLowerCase();
    }
}