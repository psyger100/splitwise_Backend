import { generateAccessToken, generateRefreshToken } from "../utils/Tokens";
import { Friendship, Members, User, Group } from "../utils/prisma";
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
                        sender: ownerId,
                        receiver: userinfo.id,
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
                    AND: [{ receiver: currentUserId }, { friendshipStatus: "pending" }],
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
    public async rejectRequest(postgresId: string) {
        //psid stands for postgresid
        try {
            const operationResponse = await Friendship.delete({
                where: { id: postgresId },
            });
            return operationResponse;
        } catch (error: any) {
            console.log(error.message);
            return null;
        }
    }
    public async acceptRequest(postgresId: string) {
        try {
            const operationResponse = await Friendship.update({
                where: { id: postgresId },
                data: {
                    friendshipStatus: "Accepted",
                },
            });
            return operationResponse;
        } catch (error: any) {
            console.log(error.message);
            return null;
        }
    }
    public async allFriends(currentUserId: any) {
        try {
            let friends: any[] = [];
            const friendsbyGettingRequest = await Friendship.findMany({
                where: {
                    receiver: currentUserId,
                    friendshipStatus: "Accepted",
                },
                select: {
                    user1: {
                        select: {
                            id: true,
                            userName: true,
                            email: true,
                        },
                    },
                },
            });
            const friendsbySendingRequest = await Friendship.findMany({
                where: {
                    sender: currentUserId,
                    friendshipStatus: "Accepted",
                },
                select: {
                    user2: {
                        select: {
                            id: true,
                            userName: true,
                            email: true,
                        },
                    },
                },
            });

            friends = [
                ...friendsbyGettingRequest.map((item) => item.user1),
                ...friendsbySendingRequest.map((item) => item.user2),
            ];

            if (friends.length > 0) {
                return friends;
            } else {
                return [];
            }
        } catch (error: any) {
            console.log("This is error ", error.message);
            return null;
        }
    }
    public async fetchGroups(currentUserId: string) {
        const groups = await Members.findMany({
            where: {
                userId: currentUserId,
            },
            select: {
                Group: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const allGroupsWithAllMembers = await Members.findMany({
            where: {
                groupId: {
                    in: groups
                        .map((item) => item.Group?.id)
                        .filter((id): id is string => id !== undefined),
                },
            },
            select: {
                User: {
                    select: {
                        id: true,
                        userName: true,
                        email: true,
                    },
                },
                Group: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        let refinedData: any = [];

        allGroupsWithAllMembers.map((item) => {
            const flag = refinedData.some(
                (element: any) => element.id === item.Group?.id,
            );
            if (!flag) {
                refinedData.push({
                    id: item.Group?.id,
                    name: item.Group?.name,
                    members: [
                        {
                            id: item.User?.id,
                            userName: item.User?.userName,
                            email: item.User?.email,
                        },
                    ],
                });
            } else {
                refinedData = refinedData.map((element: any) => {
                    if (element.id === item.Group?.id) {
                        return {
                            ...element,
                            members: [
                                ...element.members,
                                {
                                    id: item.User?.id,
                                    userName: item.User?.userName,
                                    email: item.User?.email,
                                },
                            ],
                        };
                    }
                    return element;
                });
            }
        });

        return refinedData;
    }
    public async createGroup(
        information: { name: string; members: string[] },
        currentUserId: string,
    ) {
        const group = await Group.create({
            data: {
                name: information.name,
            },
        });

        const members = information.members.map((item) => {
            return {
                userId: item,
                groupId: group.id,
            };
        });

        const membersResponse = await Members.createMany({
            data: [...members, { userId: currentUserId, groupId: group.id }],
        });
        return membersResponse;
    }
}
