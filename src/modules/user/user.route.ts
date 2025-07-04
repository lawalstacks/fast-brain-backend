import { Router, Request, Response } from "express";
import { userController } from "./user.module";
import { uploadImage } from "../../config/multer.config";
import { uploadAndGetUrl } from "../../config/storj.config";

const userRoute = Router();

userRoute.get("/session", userController.getSession);
userRoute.get("/quiz/:subject", userController.getQuiz);

export default userRoute;
