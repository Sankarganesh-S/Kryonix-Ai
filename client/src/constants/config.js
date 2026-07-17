export const APP_CONFIG = {
  APP_NAME: "Kryonix AI",
  APP_VERSION: "3.0.0",
  DEFAULT_MODEL: "llama3.1:8b",
  OLLAMA_HOST: import.meta.env.VITE_OLLAMA_HOST || "http://127.0.0.1:11434",
};
