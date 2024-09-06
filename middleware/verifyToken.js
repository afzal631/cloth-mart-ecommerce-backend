const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const verifyToken = asyncHandler((req, res, next) => {
  const token = req.cookies.accessToken;
  console.log("verifytoken ", token);
  if (!token)
    return res.status(401).json({ message: "access token expired!!" });

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  if (!decoded) return res.status(401).json({ message: "Invalid Token" });

  req.userId = decoded.userId;
  req.role = decoded.role;
  next();
});

module.exports = verifyToken;
