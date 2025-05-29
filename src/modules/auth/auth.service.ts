import { ErrorCode } from "../../common/enums/error-code.enum";
import { VerificationEnum } from "../../common/enums/verfication-code.enum";
import { RegisterDto, LoginDto } from "../../common/interface/auth.interface";
import { BadRequestException } from "../../common/utils/catch-errors";
import { fortyFiveMinutesFromNow } from "../../common/utils/date-time";
import { config } from "../../config/app.config";
import SessionModel from "../../database/models/session.model";
import UserModel from "../../database/models/user.model";
import VerificationCodeModel from "../../database/models/verification.model";
import { sendEmail } from "../../mailers/mailer";
import { verifyEmailTemplate } from "../../mailers/templates/template";
import { refreshTokenSignOptions, signJwtToken } from "../../utils/jwt";
import { logger } from "../../utils/logger";


// export class UserService {
//     public async findUser(googleId: string): Promise<any> {
//         const user = await UserModel.findOne({googleId});
//         return user;
//     }

//     public async createUser(user: any): Promise<any> {
//         const newUser = new UserModel({
//             email: user.email,
//             name: user.name,
//             photo: user.photo,
//             googleId: user.googleId
//         });
//         const savedUser = await newUser.save();
//         return savedUser;
//     }
// }

export class AuthService {
    public async register(registerData: RegisterDto) {
        const { name, email, password } = registerData;

        const existingUser = await UserModel.exists({ email });

        if (existingUser) {
            throw new BadRequestException("User with this email already exists", ErrorCode.AUTH_EMAIL_ALREADY_EXISTS);
        }

        const newUser = await UserModel.create({
            name,
            email,
            password
        })

        const userId = newUser._id;

        const verification = await VerificationCodeModel.create({
            userId,
            type: VerificationEnum.EMAIL_VERIFICATION,
            expiresAt: fortyFiveMinutesFromNow()
        })

        const verificationUrl = `${config.APP_ORIGIN}/confirm-email?code=${verification.code}`;

        console.log("Verification URL:", verificationUrl);

        // await sendEmail({
        //     to: newUser.email,
        //     ...verifyEmailTemplate(verificationUrl)
        // })

        return {
            user: newUser,
        }
    }

    public async login(loginData: LoginDto) {
        const { email, password, userAgent } = loginData;

        logger.info(`Login attempt with email: ${email}`);
        const user = await UserModel.findOne({ email });

        if (!user) {
            logger.error(`Login failed: User with email ${email} not found`);
            throw new BadRequestException("Invalid email or password", ErrorCode.AUTH_NOT_FOUND);
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            logger.error(`Login failed: Invalid password for user with email ${email}`);
            throw new BadRequestException("Invalid email or password", ErrorCode.AUTH_USER_NOT_FOUND);
        }

        if (user.userPreferences.enable2FA) {
            logger.info(`2FA required for user ID: ${user._id}`);
            return {
                user: null,
                mfaRequired: true,
                accessToken: "",
                refreshToken: "",
            };
        }

        logger.info(`Creating session for user ID: ${user._id}`);
        const session = await SessionModel.create({
            userId: user._id,
            userAgent,
        })

        logger.info(`Signing tokens for user ID: ${user._id}`);
        const accessToken = signJwtToken({
            userId: user._id,
            sessionId: session._id,
        })

        const refreshToken = signJwtToken(
            {
                sessionId: session._id,
            },
            refreshTokenSignOptions
        )

        logger.info(`Login successful for user ID: ${user._id}`);
        return {
            user,
            accessToken,
            refreshToken,
            mfaRequired: false,
        };
    }
}