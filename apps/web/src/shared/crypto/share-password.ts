import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export async function hashSharePassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifySharePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
