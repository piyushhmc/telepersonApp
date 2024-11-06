import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from "typeorm";
import { AbstractEntity } from '@app/common';


@Entity()
export class MXUserTransction extends AbstractEntity<MXUserTransction> {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({default:null})
    userGuid?:string;

    @Column({default:null})
    userId?:number;
    
    @Column({default:null})
    transctionGuid?:string;

    @Column({default:null})
    category?:string;

    @Column({default:null})
    date?:Date;

    @Column({default:null})
    status?: string;

    @Column({default:null})
    topLevelCategory?:string;

    @Column({default:null})
    transactedAt?:Date;

    @Column({default:null})
    type?:string;

    @Column({default:null})
    accountGuid?:string;

    @Column({default:null})
    accountId?:string;

    @Column({default:null})
    amount?:string;

    @Column({default:null})
    categoryGuid?:string;

    @Column({default:null})
    description?:string;

    @Column({default:null})
    extendedTransactionType?:string;

    @Column({default:null})
    isBillPay?:boolean;

    @Column({default:null})
    isManual?:boolean;

    @Column({default:null})
    isDirectDeposit?:boolean;

    @Column({default:null})
    isExpense?:boolean;

    @Column({default:null})
    isFee?:boolean;

    @Column({default:null})
    isIncome?:boolean;

    @Column({default:null})
    isOverdraftFee?:boolean;

    @Column({default:null})
    isPayrollAdvance?:boolean;

    @Column({default:null})
    isRecurring?:boolean;

    @Column({default:null})
    isSubscription?:boolean;

    @Column({default:null})
    latitude?:string;

    @Column({default:null})
    localizedDescription?:string;

    @Column({default:null})
    localizedMemo?:string;

    @Column({default:null})
    longitude?:string;

    @Column({default:null})
    memberGuid?:string;

    @Column({default:null})
    memberIsManagedByUser?:string;

    @Column({default:null})
    memo?:string;

    @Column({default:null})
    merchantCategoryCode?:string;

    @Column({default:null})
    merchantGuid?:string;

    @Column({default:null})
    merchantLocationGuid?:string;

    @Column({default:null})
    metadata?:string;

    @Column({default:null})
    originalDescription?:string;
    
    @Column({default:false})
    isProcessed:boolean;

    @Column()
    @CreateDateColumn()
    tpCreatedAt: Date;

    @Column()
    @UpdateDateColumn()
    tpUpdatedAt: Date;
}