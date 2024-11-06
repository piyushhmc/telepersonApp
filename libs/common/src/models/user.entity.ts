import { AbstractEntity } from '../database';
import { BeforeInsert, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole,Status } from "./user.interface";

@Entity()
export class User extends AbstractEntity<User> {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({unique: true})
  email: string;

  @Column()
  mobile:string;
  
  @Column()
  extension:string;

  @Column()
  facebook:string;

  @Column()
  linkedin:string;

  @Column()
  twitter:string;

  @Column()
  instagram:string;

  @Column({select: true})
  password: string;

  @Column({nullable: true})
  profileImage: string|null;

  @Column({type:'json',nullable: true })
  meta:any|null;

  @Column({type: 'enum', enum: UserRole, default: UserRole.USER})
  role: UserRole;

  @Column({type: 'enum', enum: Status, default: Status.ACTIVE})
  status:Status;

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

  @Column({default:null,nullable:true})
  usrGuid?: string|null;

  @Column({default:null,nullable:true})
  incomeBuckets?: string|null;

  @Column({default:null,nullable:true})
  state?: string|null;

  @Column({default:null,nullable:true})
  gender?: string|null;

  @Column({default:null,nullable:true})
  age?: Number|null;

  @Column({default:false})
  isMX: boolean;

  @Column({default:null,nullable:true})
  tempToken?: string|null;

  @BeforeInsert()
  emailToLowerCase() {
      this.email = this.email.toLowerCase();
  }
}
