const asyncHandler = require("express-async-handler");
const User = require("../models/user.model");
const redis = require("../redis");
const jwt = require("jsonwebtoken");
const {
  storeRefreshToken,
  setCookies,
  generateToken,
} = require("../lib/utility");
const { response } = require("express");

// @desc register new user
// route POST /api/users/register
// @access public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body; // Fixed typo: "emai" to "email"
  const user = new User({ username, email, password }); // Fixed usage: User constructor should take an object
  await user.save();
  res.status(200).json({ message: "User registered successfully!" });
});

// @desc auth user/set Token
// route POST /api/users/auth
// @access public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Incorrect Password!" });
  }
  const userData = await User.findOne({ email }).select("-password");

  // generate access token and refresh token

  const { accessToken, refreshToken } = generateToken(user._id);

  // store tokens in redis
  await storeRefreshToken(refreshToken, user._id);
  // set cookies of accesstoken and refreshtoken
  setCookies(res, accessToken, refreshToken);
  // send response to frontend
  res.status(200).json({
    message: "User Login successfully!",
    data: {
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        profession: user.profession,
      },
      accessToken: accessToken,
    },
  });
});

// @desc logoutUser
// route POST /api/users/logout
// @access private
const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log("user ", req.userId);
  if (refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log(decoded);
    await redis.del(`refreshToken:${decoded.userId}`);
  }
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.status(200).json({ message: "User logged successfully!" });
});

// @desc get all users
// route GET /api/users
// @access private
const getAllUser = asyncHandler(async (req, res) => {
  const users = await User.find({}, "id email role").sort({ createdAt: -1 });
  res.status(200).json({ message: "All users data", data: users });
});
// @desc get user profile
// route POST /api/users/profile
// @access private
const getUserProfile = asyncHandler((req, res) => {
  res.status(200).json({ message: "GET USER" });
});

// @desc update user role and password
// route POST /api/users/profile/:id
// @access private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, oldPassword, newPassword } = req.body;
  const user = await User.findById(id);

  if (oldPassword && newPassword) {
    const isMatch = await user.comparePassword(oldPassword);
    console.log(isMatch);
    if (!isMatch)
      return res.status(404).json({ message: "Old password do not match!!" });
    const isOldPdandnewPMatch = await user.comparePassword(newPassword);
    if (isOldPdandnewPMatch) {
      return res
        .status(404)
        .json({ message: "new password matches with old password!" });
    }
    user.password = newPassword;
  }
  if (!user) return res.status(404).json({ message: "User not found!!" });

  user.role = role;

  const updatedUser = await user.save();
  res.status(200).json({
    message: "User profile updated successfully!!",
    data: updatedUser,
  });
});
// @desc edit or update user profile
// route POST /api/users/edit-profile
// @access private
const editUserProfile = asyncHandler(async (req, res) => {
  const { userId, username, profileImage, bio, profession } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required!" });
  }
  const user = await User.findById(userId);
  console.log(`User ${user}`);
  if (!user) return res.status(400).json({ message: "User not found!" });

  if (username !== undefined) user.username = username;
  if (profileImage !== undefined) user.profileImage = profileImage;
  if (bio !== undefined) user.bio = bio;
  if (profession !== undefined) user.profession = profession;

  await user.save();

  res.status(200).json({
    message: "user profile updated successfully.",
    user: {
      _id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      profession: user.profession,
    },
  });
});
// @desc delete user profile
// route POST /api/users/profile/:id
// @access private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("user ", req.userId);
  // if (id === req.userId) {
  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ message: "User not found!" });
  res.status(200).json({ message: "User deleted successfully!" });
  // }
  // res.status(404).json({ message: "You dont have access to delete the user!" });
});

// @desc update access token
// route POST /api/users/refresh-token
// @access private
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token provided." });

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  const storedToken = await redis.get(`refreshToken:${decoded.userId}`);
  if (storedToken !== refreshToken)
    return res.status(401).json({ message: "Invalid refresh token!!" });

  const accessToken = jwt.sign(
    { userId: decoded.userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  console.log(accessToken);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    sameSite: true,
    maxAge: 15 * 60 * 1000,
  });

  res.status(200).json({
    message: "New Access Token generated and will be valid for next 15mins! ",
  });
});
module.exports = {
  authUser,
  registerUser,
  getUserProfile,
  logoutUser,
  updateUserProfile,
  refreshToken,
  deleteUser,
  getAllUser,
  editUserProfile,
};
