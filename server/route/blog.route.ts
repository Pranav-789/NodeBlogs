import express from "express";
import {
  postBlog,
  updateBlog,
  queryBlogById,
  queryPopularBlogs,
  checkIfUserLikedBlog,
  countBlogsByAuthor,
  queryRecentBlogs,
  likeOnBlog,
  commentOnBlog,
  queryAuthorsBlogs,
  deleteBlog,
  queryComments,
  queryBlogsByAuthorId,
  queryPublicBlogById,
} from "../controller/blog.controller.js";
import { verfiyJwt } from "../middleware/verifyJwt.js";

const router = express.Router();

router.post("/create", verfiyJwt, postBlog);
router.put("/update", verfiyJwt, updateBlog);
router.get("/get/:postId", verfiyJwt, queryBlogById);
router.get("/get-public/:postId", queryPublicBlogById);
router.get("/popular/:pageNum", queryPopularBlogs);           
router.get("/check-like/:blogId", verfiyJwt, checkIfUserLikedBlog);
router.get("/count-author/:authorId", countBlogsByAuthor);
router.get("/author/:authorId", queryBlogsByAuthorId);
router.get("/recent/:pageNum", queryRecentBlogs);
router.post("/like", verfiyJwt, likeOnBlog);
router.post("/comment", verfiyJwt, commentOnBlog);
router.get("/my-blogs", verfiyJwt, queryAuthorsBlogs);
router.delete("/delete", verfiyJwt, deleteBlog);
router.get("/comments/:blogId", queryComments);

export default router;
