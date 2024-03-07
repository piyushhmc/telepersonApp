
export interface User {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    profileImage?: string;
    meta?:any|null;
    status?:Status;
    createdAt?:Date;
    updatedAt?: Date;
    deletedAt?: Date|null;
    deletedBy?: number|null;
}

export enum UserRole {
    ADMIN = 'Admin',
    USER = 'User',
    AGENT = 'Agent',
}


export enum Status {
    ACTIVE      =   'Active',
    INACTIVE    =   'InActive',
    PENDING     =   'Pending',
    DELETED     =   'Deleted'
}
