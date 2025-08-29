import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiError } from "../utils/ApiError.utils.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  //--------------------------------------------------------------------------
  // check all inputs fields from frontend
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required...");
  }

  //--------------------------------------------------------------------------
  //check existing user
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists...");
  }
  // console.log(req.files)
  //--------------------------------------------------------------------------

  // check avatar and cover image file
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  } else {
    
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required...");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)


  //Check avatar is exist
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required...");
  }

  //create user in database using User model and frontend end/postman
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //remove password and refreshToken fildes and remove it from database
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "something went wrong while registering the user..."
    );
  }

  //
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "✅ User registered successfully"));
});

export { registerUser };
