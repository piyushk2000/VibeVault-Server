import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { FailureResponse, SuccessResponse } from "../../helpers/api-response";
import prisma from "../../database/prisma";
const JWT_SECRET = process.env.JWT_SECRET || "xyz";
const SALT_ROUNDS = 10;

interface SignUpBody {
  name: string;
  email: string;
  password: string;
}

interface SignInBody {
  email: string;
  password: string;
}

const signUp = async (req: any, res: any) => {
  try {
    const { name, email, password }: SignUpBody = req.body;


    // Basic input validation
    if (!name && !email && !password) {
      return res.status(400).json(FailureResponse("Please fill in all required fields", "4001"));
    }

    if (!name) {
      return res.status(400).json(FailureResponse("Please enter your full name", "4002"));
    }

    if (!email) {
      return res.status(400).json(FailureResponse("Please enter your email address", "4003"));
    }

    if (!password) {
      return res.status(400).json(FailureResponse("Please enter a password", "4004"));
    }

    if (password.length < 6) {
      return res.status(400).json(FailureResponse("Password must be at least 6 characters long", "4005"));
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json(FailureResponse("Please enter a valid email address", "4006"));
    }

    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res
        .status(400)
        .json(FailureResponse("An account with this email already exists. Please sign in instead or use a different email", "4122"));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json(
      SuccessResponse("User created successfully", {
        token,
        user: userWithoutPassword,
      })
    );
  } catch (error) {

    res.status(500).json(FailureResponse("Error creating user", "5122"));
  }
};

const signIn = async (req: any, res: any) => {
  try {
    const { email, password }: SignInBody = req.body;

    // Basic input validation
    if (!email && !password) {
      return res.status(400).json(FailureResponse("Please enter your email and password", "4001"));
    }

    if (!email) {
      return res.status(400).json(FailureResponse("Please enter your email address", "4002"));
    }

    if (!password) {
      return res.status(400).json(FailureResponse("Please enter your password", "4003"));
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json(FailureResponse("Please enter a valid email address", "4004"));
    }

    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json(FailureResponse("No account found with this email address. Please check your email or sign up for a new account", "4011"));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json(FailureResponse("Incorrect password. Please check your password and try again", "4012"));
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json(
      SuccessResponse("Login successful", { token, user: userWithoutPassword })
    );
  } catch (error) {

    res.status(500).json(FailureResponse("Something went wrong during login. Please try again", "5039"));
  }
};

const deleteUser = async (req: any, res: any) => {
  const { id } = req.body;
  const user = await prisma.user.delete({
    where: {
      id: id,
    },
  });
  res.json(SuccessResponse("User deleted successfully", user));
};

const getUsers = async (req: any, res: any) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      // Exclude password from the response
    },
  });
  res.json(users);
};

export { deleteUser, getUsers, signIn, signUp };
