import jwt, { Secret } from "jsonwebtoken";
import "dotenv/config";

export const generateAccessToken = (user_information: any) => {
    try {
        const accessTokenSecret: Secret | undefined = process.env.ACCESS_TOKEN_SECRET;

        if (!accessTokenSecret) {
            throw new Error("ACCESS_TOKEN_SECRET is not defined");
        }

        return jwt.sign({ ...user_information }, accessTokenSecret, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        });
    } catch (error) {
        console.log("cant generate AccessToken");
    }
};

export const generateRefreshToken = (user_information: any) => {
    try {
        const refreshTokenSecret: Secret | undefined = process.env.REFRESH_TOKEN_SECRET;

        if (!refreshTokenSecret) {
            throw new Error("REFRESH_TOKEN_SECRET is not defined.");
        }
        return jwt.sign({ ...user_information }, refreshTokenSecret, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        });
    } catch (error) {}
};
