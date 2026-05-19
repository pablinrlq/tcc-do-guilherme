/** Cliente HTTP da API SkillEx (fetch com JWT e tratamento de erros). */

const BASE = '/api';
const TOKEN_KEY = 'skillex_token';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(
  method: string,
  path: string,
  body?: unknown,
  isForm = false,
): Promise<any> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (isForm) {
      payload = body as FormData;
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  const res = await fetch(BASE + path, { method, headers, body: payload });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (res.status === 401) {
    // Sessão expirada/inválida: limpa o token e avisa a aplicação.
    // O AuthProvider escuta este evento e zera a sessão; o redirect para
    // /login acontece declarativamente via <RequireAuth>.
    setToken(null);
    window.dispatchEvent(new CustomEvent('skillex:unauthorized'));
  }

  if (!res.ok) {
    const message = (data && data.error) || 'Ocorreu um erro inesperado';
    throw new ApiError(message, res.status, data);
  }
  return data;
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: unknown) => request('POST', path, body),
  patch: (path: string, body?: unknown) => request('PATCH', path, body),
  del: (path: string, body?: unknown) => request('DELETE', path, body),
  upload: (path: string, form: FormData) => request('POST', path, form, true),
};
