const logger = typeof window !== 'undefined' && window.CoinDropLogger ? window.CoinDropLogger : console;
export const logError = (...args) => {
    if (logger && typeof logger.error === 'function') logger.error(...args);
    else console.error(...args);
};
export const logWarn = (...args) => {
    if (logger && typeof logger.warn === 'function') logger.warn(...args);
    else console.warn(...args);
};
export const logInfo = (...args) => {
    if (logger && typeof logger.info === 'function') logger.info(...args);
    else console.log(...args);
};
export const logDebug = (...args) => {
    if (logger && typeof logger.debug === 'function') logger.debug(...args);
    else console.debug(...args);
};
