import { Router, Request, Response } from "express";
import { authenticateJWT } from "../common/strategies/jwt.strategy";
import authRouter from "../modules/auth/auth.route";
import userRoute from "../modules/user/user.route";
import { uploadImage } from "../config/multer.config";
import { uploadAndGetUrl } from "../config/storj.config";

const appRouter = Router();


appRouter.use("/auth", authRouter);
appRouter.use("/user", authenticateJWT, userRoute);
appRouter.post(
  "/upload",
  uploadImage.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      const { buffer, originalname } = req.file;
      const bucket = "demo-bucket";
      const accessGrant =
        "15M6fjpDJPD7y9xKx4CaWvgEBHM6badZdfeqiRUq6p7itNmps7Z3EDdXeU9x2trkkvwM4D4xa5SDdt3nKMbwZqm8bWKo4t1TEJ5FyrBMpegyNadg24LpNoe1LSsPwvAXMj9yuhaSdqv8pnkGg2UdcMraYQXstEiyqZxp2zsGzk8wA4tSmkLyytanjbWp3zw6QuqCpTqRDkB9SQT2mzeYwiNrhVm9u7wZ9Wac6B6FUghzTEEWir3DN48UjsdeUbGbFcoAjfTojaHaSgcTnfyDk7szgqV9ugtUb";
      const url = await uploadAndGetUrl(
        buffer,
        originalname,
        bucket,
        accessGrant
      );
      res.json({ url });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default appRouter;