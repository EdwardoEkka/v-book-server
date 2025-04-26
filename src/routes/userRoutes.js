const express = require("express");
const {
  SignUpController,
  SignInController,
  AuthenticateUser,
  GoogleAuth
} = require("../controllers/userController");
const verifyToken = require("../middlewares");

const router = express.Router();

router.post("/sign-up", SignUpController);
router.post("/sign-in", SignInController);
router.get("/authenticate-user", verifyToken, AuthenticateUser);
router.post("/google-auth", GoogleAuth);

module.exports = router;
