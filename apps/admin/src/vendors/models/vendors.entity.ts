import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from "typeorm";
import { AbstractEntity } from '@app/common';


@Entity()
export class Vendors extends AbstractEntity<Vendors> {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true })
    guid: string;

    @Column({nullable: true })
    companyCode: string;

    @Column({nullable: true })
    companyName: string;

    @Column('text',{nullable: true })
    companyOverview: string;

    @Column({nullable: true })
    websiteURL: string;
   
    @Column({nullable: true }) 
    street1:string;
    
    @Column({nullable: true }) 
    city: string;

    @Column({nullable: true }) 
    state: string;

    @Column({nullable: true }) 
    zip: string;
    
    @Column({nullable: true }) 
    country: string;

    @Column({nullable: true })
    contactNumber: string;

    @Column({nullable: true })
    revenue: string;

    @Column({nullable: true })
    employees:number;

    @Column({nullable: true })
    linkedin: string;

    @Column({nullable: true })
    industry: string;

    @Column({nullable: true })
    subIndustry: string;

    @Column({nullable: true })
    logoUrl: string;
    
    @Column({nullable: true })
    foundedYear: string;

    @Column({nullable: true })
    approvalStatus: string;

    @Column({ default: 0 })
    isPopular:number;

    @Column({ default: 0 }) 
    isCommunityVendor: number;

    @Column({ default: 0 }) 
    isdefaultVendor: number;

    @Column({nullable: true })
    vendorCreatedBy: number;
    
    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;

    @Column({nullable: true })
    deletedAt: Date|null;

    @Column({nullable: true })
    deletedBy: number|null;

    @Column({nullable: true ,default: false})
    isMX: boolean;

    @Column({nullable: true })
    facebook: string;

    @Column({nullable: true })
    twitter: string;

    @Column({nullable: true })
    instagram: string;

    @Column({nullable: true })
    intentCompletedOn: Date|null;

    @Column({ default: 0 }) 
    isAllIntentAdded: number;

}