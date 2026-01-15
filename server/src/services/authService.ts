import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ConflictError } from '../utils/errors.js';
import { RegisterInput, LoginInput } from '../validators/authValidator.js';

const SALT_ROUNDS = 12;

export const register = async (input: RegisterInput) => {
  const { email, password } = input;

  // Check if email exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new ConflictError('이미 존재하는 이메일입니다');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password_hash: passwordHash })
    .select('id, email, created_at')
    .single();

  if (error) {
    throw new Error('사용자 생성에 실패했습니다');
  }

  // Generate tokens
  const tokens = generateTokens(user.id);

  return {
    user: { id: user.id, email: user.email },
    ...tokens,
  };
};

export const login = async (input: LoginInput) => {
  const { email, password } = input;

  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id, email, password_hash')
    .eq('email', email)
    .single();

  if (!user) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  // Generate tokens
  const tokens = generateTokens(user.id);

  return {
    user: { id: user.id, email: user.email },
    ...tokens,
  };
};

export const refreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('유효하지 않은 토큰입니다');
    }

    return generateTokens(decoded.userId);
  } catch {
    throw new UnauthorizedError('토큰이 만료되었습니다');
  }
};

function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: '30d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
}
