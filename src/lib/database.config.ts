// Database Configuration
// Set to 'mysql' to use MySQL backend, 'supabase' to use Supabase
export const DATABASE_TYPE: 'mysql' | 'supabase' = 'mysql';

// API URL for MySQL backend
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// WebSocket URL for realtime features
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

// Check if using MySQL
export const isMySQL = () => DATABASE_TYPE === 'mysql';

// Check if using Supabase
export const isSupabase = () => DATABASE_TYPE === 'supabase';
