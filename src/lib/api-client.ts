// API Client - Replaces Supabase client
// This provides a similar interface to make migration easier

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

class ApiError extends Error {
  status: number;
  code?: string;
  
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getAccessToken = (): string | null => {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

// Base fetch function
const apiFetch = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, headers = {}, params } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Build headers
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Add auth header if we have a token
  const token = getAccessToken();
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Add content-type for JSON body
  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: 'include', // For cookies (refresh token)
  });

  // Handle 401 - try to refresh token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      requestHeaders['Authorization'] = `Bearer ${getAccessToken()}`;
      const retryResponse = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
      
      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({}));
        throw new ApiError(error.error || 'Request failed', retryResponse.status, error.code);
      }
      
      return retryResponse.json();
    } else {
      // Refresh failed, clear tokens and redirect to login
      setAccessToken(null);
      window.location.href = '/login';
      throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.error || 'Request failed', response.status, error.code);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text);
};

// Refresh access token
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// ============ AUTH API ============

export const auth = {
  async signUp(email: string, password: string, displayName?: string) {
    const data = await apiFetch<{ user: any; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: { email, password, displayName },
    });
    setAccessToken(data.accessToken);
    return data;
  },

  async signIn(email: string, password: string) {
    const data = await apiFetch<{ user: any; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setAccessToken(data.accessToken);
    return data;
  },

  async signOut() {
    await apiFetch('/auth/logout', { method: 'POST' });
    setAccessToken(null);
  },

  async getUser() {
    return apiFetch<any>('/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiFetch('/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
  },

  // For compatibility with existing code
  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Check initial auth state
    const token = getAccessToken();
    if (token) {
      this.getUser()
        .then(user => callback('SIGNED_IN', { user }))
        .catch(() => callback('SIGNED_OUT', null));
    } else {
      callback('SIGNED_OUT', null);
    }

    // Return unsubscribe function (no-op for now)
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

// ============ DATABASE API (Supabase-like interface) ============

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

interface SelectOptions {
  count?: 'exact' | 'planned' | 'estimated';
  head?: boolean;
}

interface QueryBuilder<T> {
  select(columns?: string, options?: SelectOptions): QueryBuilder<T>;
  insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T>;
  upsert(data: Partial<T> | Partial<T>[], options?: { onConflict?: string }): QueryBuilder<T>;
  update(data: Partial<T>): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  eq(column: string, value: any): QueryBuilder<T>;
  neq(column: string, value: any): QueryBuilder<T>;
  gt(column: string, value: any): QueryBuilder<T>;
  gte(column: string, value: any): QueryBuilder<T>;
  lt(column: string, value: any): QueryBuilder<T>;
  lte(column: string, value: any): QueryBuilder<T>;
  like(column: string, value: string): QueryBuilder<T>;
  ilike(column: string, value: string): QueryBuilder<T>;
  in(column: string, values: any[]): QueryBuilder<T>;
  is(column: string, value: any): QueryBuilder<T>;
  or(filters: string): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  range(from: number, to: number): QueryBuilder<T>;
  single(): QueryBuilder<T>;
  maybeSingle(): QueryBuilder<T>;
  then<TResult>(onfulfilled?: (value: { data: T | T[] | null; error: any; count?: number | null }) => TResult): Promise<TResult>;
}

class QueryBuilderImpl<T> implements QueryBuilder<T> {
  private table: string;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private selectColumns?: string;
  private selectOptions?: SelectOptions;
  private insertData?: any;
  private upsertData?: any;
  private upsertOnConflict?: string;
  private updateData?: any;
  private filters: Array<{ column: string; operator: FilterOperator; value: any }> = [];
  private orFilters?: string;
  private orderColumn?: string;
  private orderAscending = true;
  private limitCount?: number;
  private rangeFrom?: number;
  private rangeTo?: number;
  private returnSingle = false;
  private returnMaybeSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string, options?: SelectOptions): QueryBuilder<T> {
    this.operation = 'select';
    this.selectColumns = columns;
    this.selectOptions = options;
    return this;
  }

  insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T> {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  upsert(data: Partial<T> | Partial<T>[], options?: { onConflict?: string }): QueryBuilder<T> {
    this.operation = 'upsert';
    this.upsertData = data;
    this.upsertOnConflict = options?.onConflict;
    return this;
  }

  update(data: Partial<T>): QueryBuilder<T> {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete(): QueryBuilder<T> {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: any): QueryBuilder<T> {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any): QueryBuilder<T> {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any): QueryBuilder<T> {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: any): QueryBuilder<T> {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: any): QueryBuilder<T> {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: any): QueryBuilder<T> {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, value: string): QueryBuilder<T> {
    this.filters.push({ column, operator: 'like', value });
    return this;
  }

  ilike(column: string, value: string): QueryBuilder<T> {
    this.filters.push({ column, operator: 'ilike', value });
    return this;
  }

  in(column: string, values: any[]): QueryBuilder<T> {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  is(column: string, value: any): QueryBuilder<T> {
    this.filters.push({ column, operator: 'is', value });
    return this;
  }

  or(filters: string): QueryBuilder<T> {
    this.orFilters = filters;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T> {
    this.orderColumn = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): QueryBuilder<T> {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single(): QueryBuilder<T> {
    this.returnSingle = true;
    this.limitCount = 1;
    return this;
  }

  maybeSingle(): QueryBuilder<T> {
    this.returnMaybeSingle = true;
    this.limitCount = 1;
    return this;
  }

  async then<TResult>(
    onfulfilled?: (value: { data: T | T[] | null; error: any; count?: number | null }) => TResult
  ): Promise<TResult> {
    try {
      const result = await this.execute();
      return onfulfilled ? onfulfilled(result) : (result as any);
    } catch (error: any) {
      return onfulfilled ? onfulfilled({ data: null, error, count: null }) : ({ data: null, error, count: null } as any);
    }
  }

  private async execute(): Promise<{ data: T | T[] | null; error: any; count?: number | null }> {
    const endpoint = `/db/${this.table}`;
    
    const params: Record<string, any> = {};
    
    // Add filters
    this.filters.forEach(f => {
      params[`${f.column}.${f.operator}`] = f.value;
    });
    
    if (this.orFilters) params.or = this.orFilters;
    if (this.selectColumns) params.select = this.selectColumns;
    if (this.orderColumn) params.order = `${this.orderColumn}.${this.orderAscending ? 'asc' : 'desc'}`;
    if (this.limitCount) params.limit = this.limitCount;
    if (this.rangeFrom !== undefined) params.offset = this.rangeFrom;
    
    // Handle count option
    if (this.selectOptions?.count) {
      params.count = this.selectOptions.count;
    }
    if (this.selectOptions?.head) {
      params.head = 'true';
    }

    let method: RequestMethod = 'GET';
    let body: any = undefined;

    switch (this.operation) {
      case 'insert':
        method = 'POST';
        body = this.insertData;
        break;
      case 'upsert':
        method = 'PUT';
        body = this.upsertData;
        if (this.upsertOnConflict) {
          params.onConflict = this.upsertOnConflict;
        }
        break;
      case 'update':
        method = 'PATCH';
        body = this.updateData;
        break;
      case 'delete':
        method = 'DELETE';
        break;
    }

    const response = await apiFetch<any>(endpoint, { method, body, params });
    
    // Handle head-only requests (count only, no data)
    if (this.selectOptions?.head) {
      const count = typeof response === 'object' && 'count' in response ? response.count : (Array.isArray(response) ? response.length : 0);
      return { data: null, error: null, count };
    }
    
    // Handle response with count
    let data = response;
    let count: number | null = null;
    
    if (typeof response === 'object' && 'data' in response && 'count' in response) {
      data = response.data;
      count = response.count;
    } else if (Array.isArray(response)) {
      count = response.length;
    }
    
    // Handle single/maybeSingle
    if (this.returnSingle) {
      if (Array.isArray(data)) {
        if (data.length === 0) {
          return { data: null, error: { message: 'No rows found', code: 'PGRST116' }, count };
        }
        return { data: data[0], error: null, count };
      }
      return { data, error: null, count };
    }
    
    if (this.returnMaybeSingle) {
      if (Array.isArray(data)) {
        return { data: data[0] || null, error: null, count };
      }
      return { data, error: null, count };
    }

    return { data, error: null, count };
  }
}

// Database-like interface
export const db = {
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilderImpl<T>(table);
  },
};

// ============ STORAGE API ============

export const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File): Promise<{ data: { path: string } | null; error: any }> {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const folder = path.split('/').slice(0, -1).join('/') || bucket;
          const data = await apiFetch<{ url: string; filename: string }>(`/upload/image?folder=${folder}`, {
            method: 'POST',
            body: formData,
          });
          
          return { data: { path: data.url }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },

      async remove(paths: string[]): Promise<{ data: any; error: any }> {
        try {
          await Promise.all(
            paths.map(url => 
              apiFetch('/upload', { method: 'DELETE', body: { url } })
            )
          );
          return { data: { message: 'Deleted' }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },

      getPublicUrl(path: string): { data: { publicUrl: string } } {
        // If path is already a full URL, return it
        if (path.startsWith('http')) {
          return { data: { publicUrl: path } };
        }
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        return { data: { publicUrl: `${baseUrl}/uploads/${bucket}/${path}` } };
      },
    };
  },
};

// ============ REALTIME (using Socket.IO) ============

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocket = (): Socket => {
  if (!socket) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    socket = io(wsUrl, {
      autoConnect: true,
      withCredentials: true,
    });
  }
  return socket;
};

// Socket manager for realtime features
export const socketManager = {
  connect() {
    return getSocket();
  },
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
  getSocket,
  emit(event: string, data?: any) {
    const sock = getSocket();
    sock.emit(event, data);
  },
  on(event: string, callback: (...args: any[]) => void) {
    const sock = getSocket();
    sock.on(event, callback);
  },
  off(event: string, callback?: (...args: any[]) => void) {
    const sock = getSocket();
    sock.off(event, callback);
  },
};

export const realtime = {
  channel(name: string) {
    const sock = getSocket();
    const subscriptions: Array<{ event: string; callback: Function }> = [];

    return {
      on(event: string, filter: any, callback: (payload: any) => void) {
        const eventName = `${name}:${event}`;
        const handler = (payload: any) => callback(payload);
        sock.on(eventName, handler);
        subscriptions.push({ event: eventName, callback: handler });
        return this;
      },

      subscribe() {
        sock.emit('subscribe', name);
        return this;
      },

      unsubscribe() {
        subscriptions.forEach(({ event, callback }) => {
          sock.off(event, callback as any);
        });
        sock.emit('unsubscribe', name);
      },
    };
  },

  // Join user's personal channel for notifications
  joinUserChannel(userId: string) {
    const sock = getSocket();
    sock.emit('join:user', userId);
  },
};

// ============ RPC (Remote Procedure Calls) ============

export const rpc = async <T = any>(functionName: string, params?: any): Promise<{ data: T | null; error: any }> => {
  try {
    const data = await apiFetch<T>(`/rpc/${functionName}`, {
      method: 'POST',
      body: params,
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ============ FUNCTIONS (Edge Functions replacement) ============

export const functions = {
  async invoke<T = any>(functionName: string, options?: { body?: any }): Promise<{ data: T | null; error: any }> {
    try {
      const data = await apiFetch<T>(`/functions/${functionName}`, {
        method: 'POST',
        body: options?.body,
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// ============ COMBINED CLIENT (Supabase-compatible interface) ============

export const apiClient = {
  auth,
  from: db.from,
  storage,
  channel: realtime.channel,
  rpc,
  functions,
};

export default apiClient;
