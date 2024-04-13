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
    }
    public async home(req: Request, res: Response) {
        // @ts-ignore
        console.log(req.body.current_user);

        res.status(200).json({ message: "welcome to home." });
    }
    public async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const user = await this._userManager.login(email, password);
        if (user === null) {
            res.status(401).json({ message: "Email or Password is wrong" });
        } else {
            res.status(200)
                .clearCookie("accessToken")
                .clearCookie("refreshToken")
                .cookie("refreshToken", user?.refreshtoken)
                .cookie("accessToken", user?.accesstoken)
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
}
