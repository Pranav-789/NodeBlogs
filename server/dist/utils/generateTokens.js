import jwt from "jsonwebtoken";
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;
const verifyMailTokenSecret = process.env.VERIFY_MAIL_TOKEN_SECRET;
const verifyMailTokenExpiry = process.env.VERIFY_MAIL_TOKEN_EXPIRY;
const resetPasswordTokenSecret = process.env.RESET_PASSWORD_TOKEN_SECRET;
const resetPasswordTokenExpiry = process.env.RESET_PASSWORD_TOKEN_EXPIRY;
export const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, accessTokenSecret, { expiresIn: accessTokenExpiry });
};
export const generateRefreshToken = (userId, sessionId) => {
    return jwt.sign({ userId, sessionId }, refreshTokenSecret, { expiresIn: refreshTokenExpiry });
};
export const generateVerifyMailToken = (userId) => {
    return jwt.sign({ userId }, verifyMailTokenSecret, { expiresIn: verifyMailTokenExpiry });
};
export const generateResetPasswwordToken = (userId) => {
    return jwt.sign({ userId }, resetPasswordTokenSecret, { expiresIn: resetPasswordTokenExpiry });
};
