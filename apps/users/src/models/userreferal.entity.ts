import { Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import { AbstractEntity } from '@app/common';


@Entity()
export class UserReferal extends AbstractEntity<UserReferal> {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName:string;

    @Column()
    lastName:string;

    @Column({unique: true})
    email: string;

    @Column({select: true})
    referalCode: string;
}