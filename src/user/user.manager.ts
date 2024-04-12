import { generateAccessToken, generateRefreshToken } from "../utils/Tokens";
import { User } from "../utils/prisma";
import bcrypt from "bcrypt";

export class userManager {
    constructor() {}
    public async login(email: string, password: string) {
        const userinfo = await User.findUnique({
            where: {
                email,
            },
        });

        if (!userinfo) {
            return null;
        }
        const comparision = await bcrypt.compare(password, userinfo.password);

        if (comparision) {
            const accesstoken = generateAccessToken(userinfo.id);
            const refreshtoken = generateRefreshToken(userinfo.id);
            const UpdatedRefreshTokenResponse = await User.update({
                where: {
                    id: userinfo.id,
                },
                data: {
                    refreshToken: refreshtoken,
                },
            });
            if (UpdatedRefreshTokenResponse) {
                return { accesstoken, refreshtoken, ...userinfo };
            }
        } else {
            return null;
        }
    }
    public async signup(email: string, userName: string, password: any) {
        try {
            const newpassword = await bcrypt.hash(password, 10);
            const response = await User.create({
                data: {
                    email,
                    userName,
                    password: newpassword,
                },
            });
            return { message: "User Created" };
        } catch (error) {
            return null;
        }
    }
    public async logout(email: string) {
        try {
            const user = await User.findUnique({
                where: {
                    email: email,
                },
            });
            if (user) {
                await User.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        refreshToken: null,
                    },
                });
                return "userLogOut";
            }
        } catch (error) {
            return null;
        }
    }
}
