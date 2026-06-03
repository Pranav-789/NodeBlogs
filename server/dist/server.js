import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
dotenv.config();
const app = express();
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Allow localhost and any vercel preview/deployment URLs
        if (origin.includes('localhost') || origin.includes('vercel.app')) {
            return callback(null, true);
        }
        // Allow explicitly defined client URL
        if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
            return callback(null, true);
        }
        // Block others gracefully
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 8000;
app.get('/', (_req, res) => {
    res.status(200).json({ message: 'Server is up and running' });
});
import authRouter from './route/auth.routes.js';
import userRouter from './route/user.routes.js';
import todoRouter from './route/todo.route.js';
import blogRouter from './route/blog.route.js';
import { prisma } from './db/prisma.js';
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/todo', todoRouter);
app.use('/api/blog', blogRouter);
// e.g. in some test route
app.get("/db-health", async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.json({ ok: true });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ ok: false });
    }
});
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`The server is running on port ${port}`);
    });
}
export default app;
