import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { FailureResponse, SuccessResponse } from "../../helpers/api-response";

const prisma = new PrismaClient();
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
    console.log("🚀 ~ signUp ~ req.body:", req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json(FailureResponse("Email already registered", "4122"));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
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
    console.error(error);
    res.status(500).json(FailureResponse("Error creating user", "5122"));
  }
};

const signIn = async (req: any, res: any) => {
  try {
    const { email, password }: SignInBody = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json(FailureResponse("User not found", "4011"));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json(FailureResponse("Invalid credentials", "40166"));
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json(
      SuccessResponse("Login successful", { token, user: userWithoutPassword })
    );
  } catch (error) {
    res.status(500).json(FailureResponse("Error during login", "5039"));
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
