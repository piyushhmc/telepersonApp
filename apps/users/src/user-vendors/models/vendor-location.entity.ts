import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from "typeorm";
import { AbstractEntity } from '@app/common';


@Entity()
export class VendorLocation extends AbstractEntity<VendorLocation> {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({default:null})
    vendorId?:number

    @Column({default:null})
    city?: string;

    @Column({default:null})
    country?: string;

    @Column({default: null })
    guid?: string;

    @Column({default: null })
    latitude: string;

    @Column({default: null })
    longitude: string;

    @Column({default: null })
    state?: string;

    @Column({default: null })
    merchantGuid: string;

    @Column({default: null })
    postalCode: string;

    @Column({default: null })
    streetAddress?: string;

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