import { CookieOptions, Response } from "express";
import { config } from "../config/app.config";

export const REFRESH_PATH = `${config.BASE_PATH}/auth/refresh`;

export const clearAuthenticationCookie = (res: Response): Response => 
    res.clearCookie("accessToken").clearCookie("refreshToken", {
        path: REFRESH_PATH
    })