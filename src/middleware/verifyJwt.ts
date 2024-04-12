import { Request, Response, NextFunction } from "express";
import jwt, { decode, verify } from "jsonwebtoken";
import { User } from "../utils/prisma";
import { generateAccessToken, generateRefreshToken } from "../utils/Tokens";

export const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
        req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");
    if (!accessToken) {
        //may be refresh Token exist refrestAccessTokenMiddleware will handle it.
        next();
    } else {
        try {
            const decoded_value: any = jwt.verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET as string,
            );
            const current_user = await User.findUnique({
                where: {
                    id: decoded_value.user_id.id,
                },
            });
            delete (current_user as { password?: string }).password;
            delete (current_user as { refreshToken?: string }).refreshToken;

            req.body.current_user = {
                userName: current_user?.userName,
                email: current_user?.email,
            };
            next();
        } catch (error: any) {
            // may be token is expired or invalid refreshAccesstoken middleware will hadle it.
            next();
        }
    }
};
export const refreshAccesstoken = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const refreshToken = req.cookies?.refreshToken;
    if (req.body.current_user) {
        next();
    } else if (!refreshToken) {
        res.status(410).json({ message: "Login required" });
    } else if (refreshToken) {
        try {
            const decoded_value: any = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET as string,
            );
            delete (decoded_value as { iat?: number })?.iat;
            delete (decoded_value as { exp?: number })?.exp;
            const userdets: any = await User.findUnique({
                where: {
                    id: decoded_value.user_id,
                },
            });

            if (userdets != null) {
                const newAccesstoken = await generateAccessToken({ id: userdets.id });
                req.body.current_user = {
                    userName: userdets?.userName,
                    email: userdets?.email,
                };
                res.clearCookie("accessToken")
                    .cookie("accessToken", newAccesstoken, {
                        httpOnly: true,
                        secure: true,
                    })
                    .status(210);
                next();
            } else {
                res.status(410).json({ message: "Invalid token user not found" });
            }
        } catch (error: any) {
            console.log(error.message);

            res.status(401).json({ message: "Login Required" });
        }
    }
};
