interface rol {
    id?: number,
    name?: String
}

export class User {
    username?: string;
    password?: string;
    roles: rol[] = [];
}