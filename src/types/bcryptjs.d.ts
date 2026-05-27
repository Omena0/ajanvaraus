declare module 'bcryptjs' {
  const bcrypt: {
    hash(password: string, saltRounds: number): Promise<string>;
    hashSync(password: string, saltRounds: number): string;
    compare(password: string, hash: string): Promise<boolean>;
    compareSync(password: string, hash: string): boolean;
    genSaltSync(rounds?: number): string;
  };

  export default bcrypt;
}
