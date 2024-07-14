import { generateAccessToken, generateRefreshToken } from "../utils/Tokens";
import {
    Friendship,
    Members,
    User,
    Group,
    Transaction,
    TransactionEntries,
} from "../utils/prisma";
import bcrypt from "bcrypt";
interface Transaction {
    groupId: string;
    Description: string;
    Transaction: {
        Sender: string;
        Receiver: string;
        Amount: string | number;
    }[];
}
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
            return null;
        }
    }
    public async fetchGroupsWithMembers(currentUserId: string) {
        const groupsNew = await Group.findMany({
            where: {
                users: {
                    some: {
                        userId: currentUserId,
                    },
                },
            },
            include: {
                users: {
                    select: {
                        User: {
                            select: {
                                id: true,
                                userName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        return groupsNew;
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
    public async createTransaction(transactionDetails: Transaction) {
        try {
            const transactionTableData = await Transaction.create({
                data: {
                    groupId: transactionDetails.groupId,
                    Description: transactionDetails.Description,
                },
            });

            const transactionEntriesData = await TransactionEntries.createMany({
                data: transactionDetails.Transaction.map((item: any) => ({
                    ...item,
                    transactionId: transactionTableData.id,
                })),
            });

            return transactionEntriesData;
        } catch (error) {
            console.log(error);
        }
    }
    public async getAllTransaction(currentUserId: string, gId: any) {
        try {
            const allTransaction = await Transaction.findMany({
                where: {
                    groupId: gId,
                    Group: {
                        users: {
                            some: {
                                userId: currentUserId,
                            },
                        },
                    },
                },
                include: {
                    TransactionEntries: {
                        select: {
                            Amount: true,
                            user1: {
                                select: {
                                    id: true,
                                    userName: true,
                                },
                            },
                            user2: {
                                select: {
                                    id: true,
                                    userName: true,
                                },
                            },
                        },
                    },
                },
            });

            return allTransaction;
        } catch (error: any) {
            return error.message;
        }
    }
}
