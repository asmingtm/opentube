import { Router } from "express";
import { upload, verifyJWT } from "#middlewares";
import { getCurrentUser, loginUser, logoutUser, refreshUserAccessToken, registerUser, updateUserAvatar, updateUserCover, updateUserDetails, updateUserPassword } from "#controllers";

export const userRouter = Router();

userRouter.route("/register").post(registerUser);

userRouter.route("/login").post(loginUser);

// Secured routes

userRouter.route("/get").post(verifyJWT, getCurrentUser);

/* VerifyJWT is a middleware here */
userRouter.route("/logout").post(verifyJWT, logoutUser);

/* JWT middleware is not required because authentication is technically handled by refreshUserAccessToken(); */
userRouter.route("/token/refresh").post(refreshUserAccessToken);

/* Updater routes */
userRouter.route("/update/details").post(verifyJWT, updateUserDetails);
userRouter.route("/update/password").post(verifyJWT, updateUserPassword);
userRouter.route("/update/avatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar);
userRouter.route("/update/cover").post(verifyJWT, upload.single("cover"), updateUserCover);