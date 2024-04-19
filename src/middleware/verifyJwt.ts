import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/Tokens";

const options = {
    httpOnly: true,
    secure: true,
};
export const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
    // TODO: migrate to localstorage
    const accessToken =
        req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");

    if (!accessToken) {
        //may be refresh Token exist refrestAccessTokenMiddleware will handle it.
        next();
    } else {
        try {
            const decoded_value: any = await jwt.verify(
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
            //(current_user as { refreshToken?: string }).refreshToken;

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
        res.status(401).json({ message: "Login Required" });
    } else if (refreshToken) {
        try {
            const decoded_value: any = await jwt.verify(
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
