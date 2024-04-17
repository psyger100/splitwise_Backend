import { Request, Response, NextFunction } from "express";
import jwt, { decode, verify } from "jsonwebtoken";
import { User } from "../utils/prisma";
import { generateAccessToken, generateRefreshToken } from "../utils/Tokens";

const options = {
    httpOnly: true,
    secure: true,
};
export const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken =
        req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");
    if (!accessToken) {
        console.log(req.cookies);

        console.log("no access toekn");

        //may be refresh Token exist refrestAccessTokenMiddleware will handle it.
        next();
    } else {
        try {
            const decoded_value: any = jwt.verify(
                accessToken,
                process.env.ACCESS_TOKEN_SECRET as string,
            );
            // console.log("this is decoded_value =>", decoded_value);

            // const current_user = await User.findUnique({
            //     where: {
            //         id: decoded_value.user_id.id,
            //     },
            // });
            // delete (current_user as { password?: string }).password;
            // delete (current_user as { refreshToken?: string }).refreshToken;
            // console.log("i am reaching here also");
            delete (decoded_value as { iat?: number })?.iat;
            delete (decoded_value as { exp?: number })?.exp;
            req.body.current_user = decoded_value;
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
        console.log("refresh token not found");

        res.status(410).json({ message: "Login required" });
    } else if (refreshToken) {
        try {
            const decoded_value: any = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET as string,
            );
            delete (decoded_value as { iat?: number })?.iat;
            delete (decoded_value as { exp?: number })?.exp;
            // const userdets: any = await User.findUnique({
            //     where: {
            //         id: decoded_value.id,
            //     },
            // });

            const newAccesstoken = await generateAccessToken(decoded_value);
            req.body.current_user = decoded_value;

            res.clearCookie("accessToken")
                .cookie("accessToken", newAccesstoken, {
                    ...options,
                    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                })
                .status(210);
            next();
        } catch (error: any) {
            console.log(error.message);

            res.status(401).json({ message: "Login Required" });
        }
    }
};
