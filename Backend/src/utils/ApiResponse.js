/**
 * Standardised API response helpers.
 * Ensures every endpoint returns a consistent { success, message, ...data } shape.
 *
 * Usage:
 *   ApiResponse.success(res, { bookings }, 'Fetched bookings');
 *   ApiResponse.created(res, { booking }, 'Booking created');
 *   ApiResponse.error(res, 'Something went wrong', 500);
 */
class ApiResponse {
    /**
     * Generic success response (HTTP 200 by default).
     */
    static success(res, data = {}, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            ...data,
        });
    }

    /**
     * Resource created (HTTP 201).
     */
    static created(res, data = {}, message = 'Created successfully') {
        return res.status(201).json({
            success: true,
            message,
            ...data,
        });
    }

    /**
     * Generic error response.
     */
    static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
        const body = { success: false, message };
        if (errors) body.errors = errors;
        return res.status(statusCode).json(body);
    }

    /**
     * 400 Bad Request.
     */
    static badRequest(res, message = 'Bad request') {
        return ApiResponse.error(res, message, 400);
    }

    /**
     * 401 Unauthorized.
     */
    static unauthorized(res, message = 'Unauthorized') {
        return ApiResponse.error(res, message, 401);
    }

    /**
     * 403 Forbidden.
     */
    static forbidden(res, message = 'Access denied') {
        return ApiResponse.error(res, message, 403);
    }

    /**
     * 404 Not Found.
     */
    static notFound(res, message = 'Resource not found') {
        return ApiResponse.error(res, message, 404);
    }
}

module.exports = ApiResponse;
