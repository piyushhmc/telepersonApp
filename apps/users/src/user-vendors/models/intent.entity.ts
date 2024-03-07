import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from "typeorm";
import { AbstractEntity } from '@app/common';


@Entity()

export class Intents extends AbstractEntity<Intents> {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    intentName: string;

    @Column()
    buttonDesc: string;

    @Column()
    status: string;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

}