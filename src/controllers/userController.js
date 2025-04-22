const prisma = require("../prismClient");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const argon2 = require("argon2"); 

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
      data: { name, email, hashedPassword },
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

module.exports = { SignUpController, SignInController, AuthenticateUser };
