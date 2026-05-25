import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { routes } from './routes';
import { errorHandler } from './middlewares/error-handler';
import { globalLimiter } from './middlewares/rate-limit';
import { swaggerSpec } from './config/swagger';

/**
 * Cria e configura a aplicação Express (sem iniciar o servidor),
 * facilitando testes e separação de responsabilidades.
 */
export function createApp() {
  const app = express();

  // Atrás do nginx/proxy, garante que o express-rate-limit veja o IP real.
  app.set('trust proxy', 1);

  // Headers de segurança. CORP liberado para /uploads e Swagger UI.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Arquivos enviados (fotos de perfil)
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

  // Verificação de saúde da API (inclui conectividade com o banco)
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.json({ status: 'ok', service: 'skillex-api', db: 'up' });
    } catch {
      return res.status(503).json({ status: 'unavailable', service: 'skillex-api', db: 'down' });
    }
  });

  // Documentação Swagger (disponível apenas fora de produção ou sempre, conforme preferência)
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'SkillEx API Docs',
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  // Rotas da API (prefixo /api) com limite global de requisições
  app.use('/api', globalLimiter, routes);

  // Rota não encontrada
  app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

  // Middleware global de erros (sempre por último)
  app.use(errorHandler);

  return app;
}
