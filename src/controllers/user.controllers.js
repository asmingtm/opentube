import jwt from "jsonwebtoken";
import { User } from "#models";
import { CLOUDINARY_FOLDER, COOKIE_OPTIONS, REFRESH_TOKEN_SECRET } from "#consts";
import { uploadToCloudinary } from "#services";
import { asyncHandler, ApiError, ApiResponse } from "#utils";

// Basic user controls for their account.

export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;

    if([username, email, fullName, password].some(field => field?.trim() === "")){
        throw new ApiError(400, "All fields are required!");
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if(existingUser){
        throw new ApiError(400, "User already exists!");
    }

    const newUser = await User.create({
        fullName,
        avatar: "",
        cover: "",
        username: username.toLowerCase(),
        email,
        password,
    });

    const createdUser = await User.findById(newUser?._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User registered sucessfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if(!username && !email){
        throw new ApiError(400, "Username or Email is required!")
    }

    const foundUser = await User.findOne({ $or: [{username}, {email}] }); // issue here
    if(!foundUser){
        throw new ApiError(404, "User not found!");
    }

    const isPasswordCorrect = await foundUser.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials provided");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(foundUser._id);

    const loggedInUser = await User.findById(foundUser._id).select("-password -refreshToken");

    return res.status(200)
    .cookie("accessToken", accessToken, COOKIE_OPTIONS)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
    }, "User logged in sucessfully"));
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined }
    }, {
        new: true,
    });

    return res.status(200)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json(new ApiResponse(200, {}, "User logged our sucessfully!"));
});

// Generating and assigning tokens.

const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    }
    catch(err){
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens:", err);
    }
}

export const refreshUserAccessToken = asyncHandler(async (req, res) => {
	const incommingRefreshToken = req.cookies?.refreshAccessToken || req.body.refreshToken;
	if(!incommingRefreshToken){
		throw new ApiError(401, "Unauthorized request (user doesnot have refresh token)")
	}

	try {
		const decodedToken = jwt.verify(incommingRefreshToken, REFRESH_TOKEN_SECRET);

		const foundUser = await User.findById(decodedToken._id);
		if(!foundUser){
			throw new ApiError(401, "Invalid refresh token!");
		}

		if(incommingRefreshToken !== foundUser.refreshToken){
			throw new ApiError(401, "Refresh token is expired or used");
		}

		const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(foundUser._id);

		return res.status(200)
		.cookie("accessToken", accessToken)
		.cookie("refreshToken", refreshToken)
		.json(
			new ApiResponse(201, { accessToken, refreshToken }, "Renewed refresh token and access token!")
		);
	}
	catch (err) {
		throw new ApiError(400, "Error when rewning token (invalid token)", err);
	}
});

// Retriving the user's data.

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched sucessfully"));
});

// Updating the user's account.

export const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                fullName,
                email,
            }
        },
        {
            new: true,
        }
    ).select("-password");

    return res.status(200).json(new ApiResponse(201, user, "Account details fetched sucessfully!"));
});

export const updateUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Old password did not match!");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(201, {}, "Password changed sucessfully"));
});

export const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar's file is missing..")
    }

    const avatar = await uploadToCloudinary(avatarLocalPath, CLOUDINARY_FOLDER.USER_AVATAR);
    if(!avatar || !avatar.url){
        throw new ApiError(500, "Error while updating the avatar");
    }
    
    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url,
        }
    }).select("-password");

    res.status(200).json(new ApiResponse(201, { avatar: { url: avatar.url } }, "Avatar updated sucessfully"))
});

export const updateUserCover = asyncHandler(async (req, res) => {
    
    const coverLocalPath = req.file?.path;
    if(!coverLocalPath){
        throw new ApiError(400, "Cover image's file is missing!");
    }

    const cover = await uploadToCloudinary(coverLocalPath, CLOUDINARY_FOLDER.USER_COVER);
    if(!cover || !cover?.url){
        throw new ApiError(500, "Error occured while uploading file to cloudinary:");
    }

    User.findByIdAndUpdate(req.user?._id, {
        $set: {
            cover: cover.url,
        }
    }).select("-password");

    res.status(200).json(new ApiResponse(201, { cover: { url: cover.url } }, "Cover image updated sucessfully"));
});