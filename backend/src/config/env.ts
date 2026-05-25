import dotenv from 'dotenv';

dotenv.config();

/**
 * Centraliza o acesso às variáveis de ambiente, aplicando valores padrão
 * seguros para desenvolvimento e garantindo tipagem.
 */
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET ?? 'skillex-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  port: Number(process.env.PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB ?? 5),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
};
