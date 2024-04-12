import { Router } from "express";
import { userController } from "./user/user.Controller";

const router = Router();
const routes = [
    {
        path: "/user",
        route: new userController().router,
    },
];

routes.forEach((route) => {
    router.use(route.path, route.route);
});
export default router;
