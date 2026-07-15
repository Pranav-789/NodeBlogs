import { Response, Request } from "express";
import { prisma } from "../db/prisma.js";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, generateResetPasswwordToken, generateVerifyMailToken, RefreshTokenPayload } from "../utils/generateTokens.js";
import jwt from 'jsonwebtoken'
import { sendForgotPasswordEmail, sendRegistrationVerifyEmail, sendVerifyEmailMail, transporter } from "../utils/mailer.js";

export const registerUser = async (req: Request, res: Response) => {
    const {email, name, password} = req.body;

    try {
        if(!email?.trim() || !name?.trim() || !password?.trim()){
            return res.status(400).json({message: "All fields are required"});
        }
        const normEmail = email.toLowerCase().trim();
        const existingUser = await prisma.user.findUnique({where: {email: normEmail},});

        if(existingUser){
            return res.status(400).json({message: "The user with this email already exists, failed to register"});
        }

        // const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                email: normEmail,
                name: name,
                password: hashedPassword,
                isVerified: 0
            },
        });

        const verifyEmailToken = generateVerifyMailToken(newUser.id);
        const verifyUrl = `http://localhost:${process.env.PORT}/api/auth/verify-email?token=${verifyEmailToken}`;

        sendRegistrationVerifyEmail(newUser.email, newUser.name, verifyUrl);

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            }
        })
    } catch (error) {
        console.log("Error occured in creating a user", error);
        return res.status(500).json({message: "Failed to create a new user!!"});
    }
}

export const reqVerifyEmail = async(req: Request, res: Response) => {
    const { email } = req.body;
    try {
        if (!email?.trim()) {
          return res.status(400).json({ message: "All fields are required" });
        }
        const normEmail = email.toLowerCase().trim();
        const existingUser = await prisma.user.findUnique({
          where: { email: normEmail },
        });

        if (!existingUser) {
          return res
            .status(400)
            .json({
              message:
                "The user with this email does not exists, failed to register",
            });
        }

        const verifyEmailToken = generateVerifyMailToken(existingUser.id);
        const verifyUrl = `http://localhost:${process.env.PORT}/api/auth/verify-email?token=${verifyEmailToken}`;

        sendVerifyEmailMail(normEmail, verifyUrl);
    } catch (error) {
        console.log("Error occured in sending a mail", error);
        return res
          .status(500)
          .json({ message: "Failed to send a new mail!!" });
    }
}

export const verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid or missing token" });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.VERIFY_MAIL_TOKEN_SECRET as string
        ) as jwt.JwtPayload;

        const userId = decoded.userId;

        if (!userId) {
            return res.status(400).json({ message: "Invalid token payload" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified === 1) {
            return res.status(400).json({ message: "Email already verified" });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: 1 },
        });

        return res.status(200).json({
            message: "Email verified successfully",
        });
    } catch (error) {
        return res.status(400).json({
            message: "Token expired or invalid",
        });
    }
};

export const loginUser = async(req: Request, res: Response) => {
    const {email, password} = req.body;

    try {
        if(!email?.trim() || !password?.trim()){
            return res.status(400).json({message: "All fields are required!!"});
        }
        const normEmail = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
            where: { email: normEmail },
        });

        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if(user.isVerified === 0){
            return res.status(400).json({message: "Email, is not verified, please verify your mail"});
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user.id);
        const tempSessionId = crypto.randomUUID();
        const refreshToken = generateRefreshToken(user.id, tempSessionId);

        const session = await prisma.session.create({
            data: {
                id: tempSessionId,
                userId: user.id,
                refreshToken,
                expiresAt: new Date(
                    Date.now() + 7*24*60*60*1000
                )
            }
        });
        console.log("login request received");
        return res
        .status(200)
        .cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 15 * 60 * 1000,
        })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "none",
            // secure: process.env.NODE_ENV === "production",
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .json({
            message: "Login successful",
            user: {
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.log("Error occurred logging in the user, ", error);
        return res.status(500).json({message: "Failed to login user!!"});
    }
}

export const refreshAuthTokens = async(req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token missing" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as RefreshTokenPayload;

        const sessionId = decoded.sessionId;

        const session = await prisma.session.findUnique({where: {id: sessionId}});

        if(!session || session.refreshToken !== refreshToken){
            return res.status(400).json({message: "Invalid Session!!"});
        }

        if(session.expiresAt < new Date()){
            return res.status(401).json({message: "Session expired!"})
        }

        const newAccessToken = generateAccessToken(session.userId);
        const newRefreshToken = generateRefreshToken(session.userId, session.id);

        await prisma.session.update({
            where: {id: sessionId},
            data: {
                refreshToken: newRefreshToken,
                expiresAt: new Date(
                    Date.now() + 7*24*60*60*1000 
                )
            }
        });

        return res.status(201)
        .cookie("accessToken", newAccessToken, {httpOnly: true, sameSite: 'none', secure: true})
        .cookie("refreshToken", newRefreshToken, {httpOnly: true, sameSite: 'none', secure: true})
        .json({message: "Cookies rotated successfully"});
    } catch (error) {
        return res.status(400).json({message: "Invalid or expired refresh token"})
    }
}

export const logout = async(req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(400).json({message: "Invalid token"});
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as RefreshTokenPayload;

        const {userId, sessionId} = decoded;

        const session = await prisma.session.findUnique({where: {id: sessionId}});

        if(!session){
            return res.status(401).json({message: "Invalid session!!"});
        }

        await prisma.session.delete({where: {id: sessionId}});

        return res.status(201)
        .clearCookie("refreshToken", { httpOnly: true, sameSite: "none", secure: true })
        .clearCookie("accessToken", { httpOnly: true, sameSite: "none", secure: true })
        .json({message: "Logout successful!!"});
    } catch (error) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
}

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email?.trim()) {
        return res.status(400).json({ message: "Email is required" });
    }

    const normEmail = email.toLowerCase().trim();

    try {
        const user = await prisma.user.findUnique({
            where: { email: normEmail },
        });

        // Prevent email enumeration
        if (!user) {
            return res.status(200).json({
                message: "If the email exists, a reset link has been sent",
            });
        }

        const resetToken = generateResetPasswwordToken(user.id);

        const hashedToken = await bcrypt.hash(resetToken, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
            },
        });

        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        sendForgotPasswordEmail(user.email, user.name, resetUrl);

        return res.status(200).json({
            message: "If the email exists, a reset link has been sent",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error sending reset email" });
    }
};


export const resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword?.trim()) {
        return res.status(400).json({ message: "Invalid request" });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.RESET_PASSWORD_TOKEN_SECRET!
        ) as jwt.JwtPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (
            !user ||
            !user.resetPasswordToken ||
            !user.resetPasswordExpires ||
            user.resetPasswordExpires < new Date()
        ) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const isValid = await bcrypt.compare(token, user.resetPasswordToken);

        if (!isValid) {
            return res.status(400).json({ message: "Invalid token" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        await prisma.session.deleteMany({
            where: { userId: user.id },
        });

        return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        return res.status(400).json({ message: "Token invalid or expired" });
    }
};
