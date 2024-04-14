import { generateAccessToken, generateRefreshToken } from "../utils/Tokens";
import { Friendship, User } from "../utils/prisma";
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

        delete (userinfo as { password?: string }).password;
        delete (userinfo as { refreshToken?: string }).refreshToken;
        if (comparision) {
            const accesstoken = generateAccessToken(userinfo);
            const refreshtoken = generateRefreshToken(userinfo);
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
    public async addFriend(ownerId: string, email: string) {
        try {
            const userinfo = await User.findUnique({
                where: {
                    email,
                },
            });
            if (userinfo) {
                const friendship = await Friendship.create({
                    data: {
                        userId1: ownerId,
                        userId2: userinfo.id,
                        friendshipStatus: "pending",
                    },
                });
                return friendship;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
    public async getAllFriendRequest(currentUserId: any) {
        try {
            const incomingRequest = await Friendship.findMany({
                where: {
                    AND: [{ userId2: currentUserId }, { friendshipStatus: "pending" }],
                },
                select: {
                    id: true,
                    friendshipStatus: true,
                    user1: {
                        select: {
                            userName: true,
                            email: true,
                        },
                    },
                },
            });

            if (incomingRequest.length > 0) {
                return incomingRequest;
            } else {
                return null;
            }
        } catch (error: any) {
            console.log("This is error ", error.message);
            return "error";
        }
    }
}
