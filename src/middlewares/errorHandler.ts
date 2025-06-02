import {z} from "zod";
import {ErrorRequestHandler, Response} from 'express';
import { HTTPSTATUS } from "../config/http.config";
// import { clearAuthenticationCookie, REFRESH_PATH } from "../utils/cookie";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../common/enums/error-code.enum";
import { clearAuthenticationCookies, REFRESH_PATH } from "../common/utils/cookie";

const formatZodError = (res: Response, error: z.ZodError) => {
    const errors = error?.issues?.map((err) => ({
        field: err.path.join("."),
        message: error.message,
    }))
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "validation Failed",
        error: errors
    })
}

export const  errorHandler: ErrorRequestHandler = (error, req, res, next): any => {
    console.error(`Error occured on PATH: ${req.path}`, error);

    if (req.path === REFRESH_PATH) {
        clearAuthenticationCookies(res)
    }

    if (error instanceof SyntaxError) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: "Invalid JSON format, please check your request body"
        })
    }

    if (error instanceof z.ZodError) {
        return formatZodError(res, error)
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode
        })
    }

    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: error?.message || "Unknown error occurred",
    })
}