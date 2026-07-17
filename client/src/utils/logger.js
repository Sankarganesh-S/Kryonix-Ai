const logger = {
  info: (...args) => console.info("[Kryonix]", ...args),
  warn: (...args) => console.warn("[Kryonix]", ...args),
  error: (...args) => console.error("[Kryonix]", ...args),
  debug: (...args) => console.debug("[Kryonix]", ...args),
};

export default logger;
