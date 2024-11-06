import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from "typeorm";
import { AbstractEntity } from '@app/common';


@Entity()

export class VendorIntents extends AbstractEntity<VendorIntents> {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    vendorId: number;

    @Column()
    intentId: number;

    @Column()
    voiceEngine: string;

    @Column()
    interruptVoiceEngine: string;

    @Column()
    waitTime: string;

    @Column()
    keyWord: string;

    @Column()
    algorithm: string;

    @Column()
    buttonDiscription: string;

    @Column()
    status: number;

    @Column()
    buttonComments: string;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

}