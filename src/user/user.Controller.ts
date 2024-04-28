import { Request, Response, Router } from "express";
import { catchAsync } from "../utils/catchAsyncWrapper";
import { userManager } from "./user.manager";
import { refreshAccesstoken, verifyJwt } from "../middleware/verifyJwt";

export class userController {
    public router = Router();
    private _userManager = new userManager();
    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post("/login", catchAsync(this.login.bind(this)));
        this.router.post("/signup", catchAsync(this.signup.bind(this)));
        this.router.post(
            "/",
            verifyJwt,
            refreshAccesstoken,
            catchAsync(this.home.bind(this)),
        );
        this.router.post(
            "/me",
            verifyJwt,
            refreshAccesstoken,
            catchAsync(this.me.bind(this)),
        );
        this.router.post(
            "/logout",
            verifyJwt,
            refreshAccesstoken,
            this.logout.bind(this),
        );
        this.router.post(
            "/addFriend",
            verifyJwt,
            refreshAccesstoken,
            this.addFriend.bind(this),
        );
        this.router.get(
            "/getAllFriendRequest",
            verifyJwt,
            refreshAccesstoken,
            this.getAllFriendRequest.bind(this),
        );
        this.router.post(
            "/rejectRequest",
            verifyJwt,
            refreshAccesstoken,
            this.rejectRequest.bind(this),
        );
        this.router.post(
            "/acceptRequest",
            verifyJwt,
            refreshAccesstoken,
            this.acceptRequest.bind(this),
        );
        this.router.get(
            "/allFriends",
            verifyJwt,
            refreshAccesstoken,
            this.allFriends.bind(this),
        );
        this.router.get(
            "/fetchGroups",
            verifyJwt,
            refreshAccesstoken,
            this.fetchGroups.bind(this),
        );
        this.router.post(
            "/createGroup",
            verifyJwt,
            refreshAccesstoken,
            this.createGroup.bind(this),
        );
    }
    public async home(req: Request, res: Response) {
        res.status(200).json({ message: "welcome to home." });
    }
    public async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const user = await this._userManager.login(email, password);
        if (user === null) {
            res.status(401).json({ message: "Email or Password is wrong" });
        } else {
            const options = {
                httpOnly: true,
                secure: true,
                sameSite: true,
            };

            res.status(200)
                .clearCookie("accessToken")
                .clearCookie("refreshToken")
                .cookie("refreshToken", user?.refreshtoken, {
                    ...options,
                    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                })
                .cookie("accessToken", user?.accesstoken, {
                    ...options,
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                })
                .json({ userName: user?.userName, email: user?.email });
        }
    }
    public async signup(req: Request, res: Response) {
        const { userName, email, password } = req.body;
        const response: any = await this._userManager.signup(email, userName, password);
        if (response) {
            res.status(200).json(response);
        } else {
            res.status(400).json({ message: response?.message });
        }
    }
    public async me(req: Request, res: Response) {
        // TODO: add id to the token
        // const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

        res.status(200).json({ ...req.body.current_user });
    }
    public async logout(req: Request, res: Response) {
        const response = await this._userManager.logout(req.body.current_user.email);
        if (response) {
            res.status(200)
                .clearCookie("accessToken")
                .clearCookie("refreshToken")
                .json({ message: "user Logged Out" });
        } else {
            res.status(401).json({ message: "invalid request" });
        }
    }
    public async addFriend(req: Request, res: Response) {
        // TODO: make warning feature also
        const ownerId = req.body.current_user.id;

        const response = await this._userManager.addFriend(
            ownerId,
            req.body.requestEmail,
        );

        if (response) {
            return res.status(200).json({ message: "Request Sent" });
        }
        return res.status(404).json({ message: "User not found" });
    }
    public async getAllFriendRequest(req: Request, res: Response) {
        const currentUserId = req.body.current_user.id;
        const allRequest = await this._userManager.getAllFriendRequest(currentUserId);

        if (allRequest) {
            if (allRequest != "error") {
                res.status(200).json({ requests: allRequest });
            } else {
                res.status(500).json({ message: "server error" });
            }
        } else {
            res.status(200).json({ requests: [] });
        }
    }
    public async rejectRequest(req: Request, res: Response) {
        const response = await this._userManager.rejectRequest(req.body.id);
        if (response) {
            res.status(200).json({ message: "request rejected" });
        } else {
            res.status(500).json({ message: "server error" });
        }
    }
    public async acceptRequest(req: Request, res: Response) {
        const response = await this._userManager.acceptRequest(req.body.id);
        if (response) {
            res.status(200).json({ message: "request Accepted" });
        } else {
            res.status(500).json({ message: "server error" });
        }
    }
    public async allFriends(req: Request, res: Response) {
        const response = await this._userManager.allFriends(req.body.current_user.id);
        if (response) {
            return res.status(200).json({ friends: response });
        }

        return res.status(500).json({ error: "can't fetch Friends" });
    }
    public async fetchGroups(req: Request, res: Response) {
        const currentUserId = req.body.current_user.id;
        const userGroups = await this._userManager.fetchGroupsWithMembers(currentUserId);
        return res.status(200).json(userGroups);
    }
    public async createGroup(req: Request, res: Response) {
        const information = req.body.createGroup;
        const response = await this._userManager.createGroup(
            req.body.createGroup,
            req.body.current_user.id,
        );
        if (response) {
            return res.status(200).json({ message: "group created" });
        }
        return res.status(500).json({ message: "server error" });
    }
}
