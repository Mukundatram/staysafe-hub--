/**
 * Async handler wrapper to eliminate try/catch boilerplate in route handlers.
 * Catches rejected promises and forwards errors to Express global error middleware.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
