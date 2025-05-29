import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { HTTPSTATUS } from "../../config/http.config";
import { loginSchema, registerSchema } from "../../common/validators/auth.validator";
import { AuthService } from "./auth.service";
import { setAuthenticationCookies } from "../../common/utils/cookie";


export class AuthController {
    private authService: AuthService

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    /**
     * @desc User registration
     * @route POST /auth/register
     * @access Public
     */
    public register = asyncHandler(
        async (req: Request, res: Response) => {
            const body = registerSchema.parse({
                ...req.body,
            });

            const { user } = await this.authService.register(body);
            return res.status(HTTPSTATUS.CREATED).json({
                message: "User registered successfully",
                data: user
            })
        }
    )

    /**
     * @desc User login
     * @route POST /auth/login
     * @access Public
     */
    public login = asyncHandler(
        async (req: Request, res: Response) => {
            const userAgent = req.headers["user-agent"];
            const body = loginSchema.parse({
                ...req.body,
                userAgent,
            });

            const { user, accessToken, refreshToken, mfaRequired } =
                await this.authService.login(body);

            if (mfaRequired) {
                return res.status(HTTPSTATUS.OK).json({
                    message: "Verify MFA authentication",
                    mfaRequired,
                    user,
                });
            }

            return setAuthenticationCookies({
                res,
                accessToken,
                refreshToken,
            }).status(HTTPSTATUS.OK).json({
                message: "User logged in successfully",
                mfaRequired,
                user,
            });

        }
    );
    
}