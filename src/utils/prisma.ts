import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
export const User = prisma.user;
export const Friendship = prisma.friendship;
export const Members = prisma.userOnGroups;
export const Group = prisma.group;
