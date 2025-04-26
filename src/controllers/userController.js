const prisma = require("../prismClient");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const argon2 = require("argon2"); 
const crypto = require("crypto"); 

const SignUpController = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await argon2.hash(password);

    // Create new user
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const userName = newUser.name.toLocaleLowerCase();
    await prisma.folder.create({
      data: {
        name: `${userName}@root`,
        parentFolderId: null,
        userId: newUser.id,
      },
    });

    res
      .status(201)
      .json({
        success: true,
        message: "User created successfully",
        user: newUser,
      });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ success: false, error });
  }
};

const SignInController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Compare passwords
    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .status(200)
      .json({ success: true, token, message: "Sign In Successful" });
  } catch (error) {
    console.error("Error in signing in:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const AuthenticateUser = async (req, res) => {
  const user = req.user;
  const id = user.id;
  const userDetails = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  res.json({
    message: "Authentication Successful.",
    user: userDetails,
  });
};

const GoogleAuth = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    const { access_token, id_token } = tokenData;

    if (!access_token || !id_token) {
      return res.status(401).json({ error: "Failed to get tokens from Google" });
    }

    // 2. Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = await userInfoRes.json();


    // 3. Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // 4. User doesn't exist, create a new user
      const randomPassword = crypto.randomBytes(32).toString("hex"); // strong random password
      const hashedPassword = await require("argon2").hash(randomPassword);

      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          password: hashedPassword,
        },
      });

      // Create user's root folder (like you did in SignUpController)
      const userName = user.name.toLowerCase();
      await prisma.folder.create({
        data: {
          name: `${userName}@root`,
          parentFolderId: null,
          userId: user.id,
        },
      });
    }

    // 5. Create JWT token
    const appToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // 6. Send token & user back
    res.status(200).json({
      success: true,
      token: appToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).json({ success: false, error: "Something went wrong during authentication" });
  }
};

module.exports = { SignUpController, SignInController, AuthenticateUser, GoogleAuth };
