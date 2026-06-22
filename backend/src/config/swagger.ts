import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SkillEx API',
      version: '1.0.0',
      description:
        'API REST da plataforma SkillEx — troca de habilidades entre usuários. ' +
        'Autentique-se via **POST /api/auth/login** e use o token JWT no botão **Authorize**.',
      contact: { name: 'TCC SkillEx' },
    },
    servers: [{ url: '/api', description: 'API principal' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensagem de erro' },
          },
        },
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatarUrl: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            state: { type: 'string', nullable: true },
            reputation: { type: 'number' },
            coins: { type: 'integer' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOi...' },
            user: { $ref: '#/components/schemas/UserPublic' },
          },
        },
        Request: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['EXCHANGE', 'COIN'] },
            status: {
              type: 'string',
              enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
            },
            message: { type: 'string', nullable: true },
            coinAmount: { type: 'integer', nullable: true },
            suggestedDate: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            senderId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: {
              type: 'string',
              enum: [
                'REQUEST_RECEIVED',
                'REQUEST_ACCEPTED',
                'REQUEST_REJECTED',
                'REQUEST_CANCELLED',
                'REQUEST_COMPLETED',
                'NEW_MESSAGE',
                'NEW_MATCH',
                'REVIEW_RECEIVED',
                'COINS_RECEIVED',
              ],
            },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            balance: { type: 'integer' },
            lockedBalance: { type: 'integer' },
          },
        },
        WalletTransaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: {
              type: 'string',
              enum: ['PURCHASE', 'EARNING', 'SPEND', 'LOCK', 'UNLOCK', 'REFUND', 'BONUS'],
            },
            amount: { type: 'integer' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        MatchResult: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            breakdown: {
              type: 'object',
              properties: {
                reciprocity: { type: 'number' },
                skillMatch: { type: 'number' },
                location: { type: 'number' },
                language: { type: 'number' },
                modality: { type: 'number' },
                availability: { type: 'number' },
                activity: { type: 'number' },
              },
            },
            user: { $ref: '#/components/schemas/UserPublic' },
          },
        },
        Skill: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            categoryId: { type: 'string' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      // ─── AUTH ─────────────────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Cadastrar novo usuário',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 80, example: 'Maria Silva' },
                    email: { type: 'string', format: 'email', example: 'maria@example.com' },
                    password: { type: 'string', minLength: 6, example: 'senha123' },
                    bio: { type: 'string', maxLength: 200, nullable: true },
                    city: { type: 'string', maxLength: 80, nullable: true, example: 'São Paulo' },
                    state: { type: 'string', maxLength: 80, nullable: true, example: 'SP' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Usuário criado',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
              },
            },
            400: { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            409: { description: 'E-mail já cadastrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Autenticar usuário',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'maria@example.com' },
                    password: { type: 'string', example: 'senha123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login bem-sucedido',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
              },
            },
            401: { description: 'Credenciais inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Retornar usuário autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Dados do usuário',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/UserPublic' } },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/change-password': {
        post: {
          tags: ['Auth'],
          summary: 'Alterar senha do usuário autenticado',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string', example: 'senhaAtual123' },
                    newPassword: { type: 'string', minLength: 6, example: 'novaSenha456' },
                  },
                },
              },
            },
          },
          responses: {
            204: { description: 'Senha alterada com sucesso' },
            400: { description: 'Senha atual incorreta', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Solicitar redefinição de senha',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'maria@example.com' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Token de redefinição enviado (sempre retorna 200 por segurança)' },
          },
        },
      },
      '/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Redefinir senha com token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'password'],
                  properties: {
                    token: { type: 'string', example: 'abc123token' },
                    password: { type: 'string', minLength: 6, example: 'novaSenha456' },
                  },
                },
              },
            },
          },
          responses: {
            204: { description: 'Senha redefinida com sucesso' },
            400: { description: 'Token inválido ou expirado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── USERS ────────────────────────────────────────────────────────────
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Busca avançada de usuários',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Texto livre (nome, bio)' },
            { name: 'skillId', in: 'query', schema: { type: 'string' } },
            { name: 'categoryId', in: 'query', schema: { type: 'string' } },
            { name: 'modality', in: 'query', schema: { type: 'string', enum: ['ONLINE', 'IN_PERSON', 'BOTH'] } },
            { name: 'level', in: 'query', schema: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] } },
            { name: 'city', in: 'query', schema: { type: 'string' } },
            { name: 'state', in: 'query', schema: { type: 'string' } },
            { name: 'language', in: 'query', schema: { type: 'string' } },
            { name: 'gender', in: 'query', schema: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'] } },
            { name: 'minAge', in: 'query', schema: { type: 'integer' } },
            { name: 'maxAge', in: 'query', schema: { type: 'integer' } },
            { name: 'acceptsCoins', in: 'query', schema: { type: 'boolean' } },
            { name: 'acceptsExchange', in: 'query', schema: { type: 'boolean' } },
            { name: 'availability', in: 'query', schema: { type: 'string', enum: ['MORNING', 'AFTERNOON', 'NIGHT', 'WEEKEND'] } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 12, maximum: 50 } },
          ],
          responses: {
            200: {
              description: 'Lista paginada de usuários',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/UserPublic' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/users/me': {
        patch: {
          tags: ['Users'],
          summary: 'Atualizar dados básicos do perfil',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 80 },
                    bio: { type: 'string', maxLength: 200 },
                    city: { type: 'string', maxLength: 80 },
                    state: { type: 'string', maxLength: 80 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Perfil atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPublic' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Users'],
          summary: 'Excluir conta do usuário autenticado',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['password'],
                  properties: { password: { type: 'string', example: 'minha-senha' } },
                },
              },
            },
          },
          responses: {
            204: { description: 'Conta excluída' },
            400: { description: 'Senha incorreta', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/users/me/profile': {
        patch: {
          tags: ['Users'],
          summary: 'Atualizar perfil estendido',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'] },
                    birthDate: { type: 'string', format: 'date', example: '1995-06-15' },
                    nationality: { type: 'string', maxLength: 60 },
                    languages: { type: 'array', items: { type: 'string' }, example: ['Português', 'Inglês'] },
                    learningPrefs: { type: 'array', items: { type: 'string' } },
                    availability: { type: 'array', items: { type: 'string', enum: ['MORNING', 'AFTERNOON', 'NIGHT', 'WEEKEND'] } },
                    preferredModality: { type: 'string', enum: ['ONLINE', 'IN_PERSON', 'BOTH'] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Perfil atualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPublic' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/users/me/onboarding': {
        post: {
          tags: ['Users'],
          summary: 'Completar onboarding (perfil + habilidades)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    profile: { type: 'object', description: 'Campos opcionais de perfil' },
                    teachingSkills: { type: 'array', items: { type: 'object' } },
                    learningSkills: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Onboarding concluído', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPublic' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/users/me/avatar': {
        post: {
          tags: ['Users'],
          summary: 'Enviar foto de perfil',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['avatar'],
                  properties: { avatar: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Avatar atualizado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { avatarUrl: { type: 'string' } },
                  },
                },
              },
            },
            400: { description: 'Arquivo inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/users/me/favorites': {
        get: {
          tags: ['Users'],
          summary: 'Listar usuários favoritos',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de favoritos',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/UserPublic' } },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Obter perfil público de um usuário',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Perfil público', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPublic' } } } },
            404: { description: 'Usuário não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/users/{id}/favorite': {
        post: {
          tags: ['Users'],
          summary: 'Adicionar usuário aos favoritos',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Adicionado' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Users'],
          summary: 'Remover usuário dos favoritos',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Removido' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── SKILLS & CATEGORIES ──────────────────────────────────────────────
      '/categories': {
        get: {
          tags: ['Skills'],
          summary: 'Listar categorias de habilidades',
          responses: {
            200: {
              description: 'Lista de categorias',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                },
              },
            },
          },
        },
      },
      '/skills': {
        get: {
          tags: ['Skills'],
          summary: 'Listar todas as habilidades',
          parameters: [
            { name: 'categoryId', in: 'query', schema: { type: 'string' } },
            { name: 'q', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Lista de habilidades',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
                },
              },
            },
          },
        },
      },
      '/skills/me': {
        get: {
          tags: ['Skills'],
          summary: 'Obter habilidades do usuário autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Habilidades do usuário (ensina e aprende)' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/skills/me/saved': {
        get: {
          tags: ['Skills'],
          summary: 'Listar habilidades salvas (bookmarks)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Habilidades salvas',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/skills/suggestions': {
        get: {
          tags: ['Skills'],
          summary: 'Sugestões de habilidades para o usuário',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Sugestões',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/skills/{id}/save': {
        post: {
          tags: ['Skills'],
          summary: 'Salvar habilidade (bookmark)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Salvo' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Skills'],
          summary: 'Remover habilidade salva',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Removido' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/skills/teaching': {
        post: {
          tags: ['Skills'],
          summary: 'Adicionar habilidade que o usuário ensina',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['skillId', 'level'],
                  properties: {
                    skillId: { type: 'string' },
                    level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
                    modality: { type: 'string', enum: ['ONLINE', 'IN_PERSON', 'BOTH'] },
                    acceptsCoins: { type: 'boolean' },
                    acceptsExchange: { type: 'boolean' },
                    description: { type: 'string', maxLength: 300 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Habilidade adicionada' },
            400: { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/skills/teaching/{id}': {
        patch: {
          tags: ['Skills'],
          summary: 'Atualizar habilidade que o usuário ensina',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
                    modality: { type: 'string', enum: ['ONLINE', 'IN_PERSON', 'BOTH'] },
                    acceptsCoins: { type: 'boolean' },
                    acceptsExchange: { type: 'boolean' },
                    description: { type: 'string', maxLength: 300 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Atualizado' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Skills'],
          summary: 'Remover habilidade que o usuário ensina',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Removido' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/skills/learning': {
        post: {
          tags: ['Skills'],
          summary: 'Adicionar habilidade que o usuário quer aprender',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['skillId'],
                  properties: {
                    skillId: { type: 'string' },
                    currentLevel: { type: 'string', enum: ['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
                    desiredLevel: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Habilidade adicionada' },
            400: { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/skills/learning/{id}': {
        patch: {
          tags: ['Skills'],
          summary: 'Atualizar habilidade que o usuário quer aprender',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currentLevel: { type: 'string', enum: ['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
                    desiredLevel: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Atualizado' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Skills'],
          summary: 'Remover habilidade que o usuário quer aprender',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Removido' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── FEED ─────────────────────────────────────────────────────────────
      '/feed': {
        get: {
          tags: ['Feed'],
          summary: 'Obter feed personalizado de usuários',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
          ],
          responses: {
            200: {
              description: 'Feed paginado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/UserPublic' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/feed/suggestions': {
        get: {
          tags: ['Feed'],
          summary: 'Sugestões de usuários para conectar',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de sugestões',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/UserPublic' } },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── MATCH ────────────────────────────────────────────────────────────
      '/match/{userId}': {
        get: {
          tags: ['Match'],
          summary: 'Calcular score de compatibilidade com outro usuário',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Resultado do match',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/MatchResult' } },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Usuário não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── REQUESTS ─────────────────────────────────────────────────────────
      '/requests': {
        post: {
          tags: ['Requests'],
          summary: 'Criar solicitação de troca ou moeda',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['recipientId', 'requestedSkillId', 'type'],
                  properties: {
                    recipientId: { type: 'string' },
                    requestedSkillId: { type: 'string' },
                    type: { type: 'string', enum: ['EXCHANGE', 'COIN'] },
                    offeredSkillId: { type: 'string', description: 'Obrigatório se type=EXCHANGE' },
                    coinAmount: { type: 'integer', minimum: 1, maximum: 100000 },
                    message: { type: 'string', maxLength: 500 },
                    suggestedDate: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Solicitação criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Request' } } } },
            400: { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        get: {
          tags: ['Requests'],
          summary: 'Listar solicitações do usuário autenticado',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'] } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: {
              description: 'Lista de solicitações',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Request' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/requests/{id}': {
        get: {
          tags: ['Requests'],
          summary: 'Detalhe de uma solicitação',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Solicitação', content: { 'application/json': { schema: { $ref: '#/components/schemas/Request' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/requests/{id}/accept': {
        post: {
          tags: ['Requests'],
          summary: 'Aceitar solicitação',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Aceita' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            404: { description: 'Não encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/requests/{id}/reject': {
        post: {
          tags: ['Requests'],
          summary: 'Rejeitar solicitação',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Rejeitada' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/requests/{id}/cancel': {
        post: {
          tags: ['Requests'],
          summary: 'Cancelar solicitação',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Cancelada' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/requests/{id}/complete': {
        post: {
          tags: ['Requests'],
          summary: 'Marcar solicitação como concluída',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Concluída' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/requests/{id}/messages': {
        get: {
          tags: ['Requests'],
          summary: 'Listar mensagens de uma solicitação',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Mensagens',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        post: {
          tags: ['Requests'],
          summary: 'Enviar mensagem em uma solicitação',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: { content: { type: 'string', minLength: 1, maxLength: 1000 } },
                },
              },
            },
          },
          responses: {
            201: { description: 'Mensagem enviada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── WALLET ───────────────────────────────────────────────────────────
      '/wallet': {
        get: {
          tags: ['Wallet'],
          summary: 'Obter carteira do usuário autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Carteira',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Wallet' } } },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/wallet/history': {
        get: {
          tags: ['Wallet'],
          summary: 'Histórico de transações da carteira',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: {
              description: 'Histórico paginado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/WalletTransaction' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/wallet/purchase': {
        post: {
          tags: ['Wallet'],
          summary: 'Comprar moedas (SkillCoins)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['packageId'],
                  properties: {
                    packageId: { type: 'string', example: 'pack_100' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Compra realizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Wallet' } } } },
            400: { description: 'Pacote inválido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── REVIEWS ──────────────────────────────────────────────────────────
      '/reviews': {
        post: {
          tags: ['Reviews'],
          summary: 'Criar avaliação para um usuário',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['requestId', 'rating'],
                  properties: {
                    requestId: { type: 'string' },
                    rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                    comment: { type: 'string', maxLength: 500 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Avaliação criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Review' } } } },
            400: { description: 'Dados inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/reviews/user/{userId}': {
        get: {
          tags: ['Reviews'],
          summary: 'Listar avaliações de um usuário',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: {
              description: 'Avaliações',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── NOTIFICATIONS ────────────────────────────────────────────────────
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Listar notificações do usuário',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: {
              description: 'Notificações',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/notifications/unread-count': {
        get: {
          tags: ['Notifications'],
          summary: 'Contar notificações não lidas',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Contagem',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { count: { type: 'integer' } } },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/notifications/read-all': {
        post: {
          tags: ['Notifications'],
          summary: 'Marcar todas as notificações como lidas',
          security: [{ bearerAuth: [] }],
          responses: {
            204: { description: 'Marcadas como lidas' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/notifications/{id}/read': {
        post: {
          tags: ['Notifications'],
          summary: 'Marcar notificação como lida',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Marcada como lida' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── STATS ────────────────────────────────────────────────────────────
      '/stats/trends': {
        get: {
          tags: ['Stats'],
          summary: 'Tendências de habilidades na plataforma',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Tendências' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/stats/ranking': {
        get: {
          tags: ['Stats'],
          summary: 'Ranking de reputação de usuários',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'Ranking paginado' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/stats/overview': {
        get: {
          tags: ['Stats', 'Admin'],
          summary: 'Visão geral da plataforma (somente admins)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Métricas gerais da plataforma' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Acesso negado (requer ADMIN)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },

      // ─── ADMIN ────────────────────────────────────────────────────────────
      '/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'Listar todos os usuários (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: {
              description: 'Lista de usuários',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/UserPublic' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Acesso negado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/users/{id}/status': {
        patch: {
          tags: ['Admin'],
          summary: 'Ativar ou desativar usuário (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['isActive'],
                  properties: { isActive: { type: 'boolean' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Status atualizado' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Acesso negado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/categories': {
        post: {
          tags: ['Admin'],
          summary: 'Criar categoria (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: { name: { type: 'string', minLength: 2, maxLength: 60 } },
                },
              },
            },
          },
          responses: {
            201: { description: 'Categoria criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Acesso negado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/categories/{id}': {
        patch: {
          tags: ['Admin'],
          summary: 'Atualizar categoria (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { name: { type: 'string', minLength: 2, maxLength: 60 } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Atualizada' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Acesso negado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Admin'],
          summary: 'Deletar categoria (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Deletada' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Acesso negado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/skills': {
        post: {
          tags: ['Admin'],
          summary: 'Criar habilidade (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'categoryId'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 80 },
                    categoryId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Habilidade criada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Skill' } } } },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Acesso negado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/admin/skills/{id}': {
        patch: {
          tags: ['Admin'],
          summary: 'Atualizar habilidade (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 80 },
                    categoryId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Atualizada' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Acesso negado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        delete: {
          tags: ['Admin'],
          summary: 'Deletar habilidade (admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Deletada' },
            401: { description: 'Não autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Acesso negado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Autenticação e gerenciamento de conta' },
      { name: 'Users', description: 'Perfis de usuários e favoritos' },
      { name: 'Skills', description: 'Habilidades e categorias' },
      { name: 'Feed', description: 'Feed personalizado' },
      { name: 'Match', description: 'Algoritmo de compatibilidade' },
      { name: 'Requests', description: 'Solicitações de troca e mensagens' },
      { name: 'Wallet', description: 'Carteira e SkillCoins' },
      { name: 'Reviews', description: 'Avaliações entre usuários' },
      { name: 'Notifications', description: 'Notificações em tempo real' },
      { name: 'Stats', description: 'Estatísticas e rankings' },
      { name: 'Admin', description: 'Painel administrativo (role ADMIN)' },
    ],
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
