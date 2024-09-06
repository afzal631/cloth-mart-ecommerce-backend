const express = require("express");
const {
  authUser,
  registerUser,
  getUserProfile,
  logoutUser,
  updateUserProfile,
  refreshToken,
  deleteUser,
  getAllUser,
  editUserProfile,
} = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/logout", verifyToken, logoutUser);
router.get("/all-users", verifyToken, getAllUser);
router.patch("/edit-profile", verifyToken, editUserProfile);
router
  .route("/profile/:id")
  .get(verifyToken, getUserProfile) //get profile
  .put(verifyToken, updateUserProfile) //update role and password
  .delete(verifyToken, deleteUser); //delete user

router.post("/refresh-token", refreshToken);

module.exports = router;
