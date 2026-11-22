import { userRouter } from "#routes";

const apiRoute = "/api/v1"

export function registerRoutes(app) {
    app.use(apiRoute + "/user", userRouter);
}