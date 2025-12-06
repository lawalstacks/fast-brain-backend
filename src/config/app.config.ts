// src/config/env.ts
// Load dotenv only in development environment
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

/**
 * Helper function to get environment variables with validation
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set (optional)
 * @returns Environment variable value
 * @throws Error if variable is not set and no default provided
 */
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];

  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value;
};

/**
 * Application configuration object
 * All environment variables are loaded and validated here
 */
const appConfig = () => ({
  // Server Configuration
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "8000"),
  BASE_PATH: getEnv("BASE_PATH", "/api/v1"),
  APP_ORIGIN: getEnv("APP_ORIGIN", "http://localhost:5173"),

  // Database Configuration
  MONGO_URI: getEnv("MONGO_URI"),

  // Redis Configuration
  REDIS: {
    USERNAME: getEnv("REDIS_USERNAME", "default"),
    PASSWORD: getEnv("REDIS_PASSWORD"),
    HOST: getEnv("REDIS_HOST"),
    PORT: parseInt(getEnv("REDIS_PORT", "17532")),
  },

  // JWT Configuration
  JWT: {
    SECRET: getEnv("JWT_SECRET"),
    EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "15m"),
    REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
    REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN", "30d"),
  },

  // Email Configuration (Brevo)
  BREVO: {
    HOST_URL: getEnv("BREVO_HOST_URL", "smtp-relay.brevo.com"),
    USER: getEnv("BREVO_USER", ""),
    PASS_KEY: getEnv("BREVO_PASS_KEY", ""),
  },

  // Email Configuration (Resend)
  RESEND: {
    API_KEY: getEnv("RESEND_API_KEY"),
    FROM_EMAIL: getEnv("RESEND_FROM_EMAIL"),
  },

  // Cloudinary Configuration
  CLOUDINARY: {
    CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME"),
    API_KEY: getEnv("CLOUDINARY_API_KEY"),
    API_SECRET: getEnv("CLOUDINARY_API_SECRET"),
  },

  // Payment Configuration (Paystack)
  PAYSTACK: {
    SECRET_KEY: getEnv("PAYSTACK_SECRET_KEY"),
    PUBLIC_KEY: getEnv("PAYSTACK_PUBLIC_KEY"),
    BASE_URL: getEnv("PAYSTACK_BASE_URL", "https://api.paystack.co"),
  },

  // Other API Keys
  ALOC_ACCESS_TOKEN: getEnv("ALOC_ACCESS_TOKEN"),
});

// Export the configuration object
export const config = appConfig();

// Export type for TypeScript intellisense
export type Config = ReturnType<typeof appConfig>;