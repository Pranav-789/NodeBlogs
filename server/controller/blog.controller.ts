import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import DOMPurify from "isomorphic-dompurify";

export const postBlog = async(req: Request, res: Response) => {
    const {content, title, authorName} = req.body;
    const userId = req.user.userId;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        const authorName = user?.name || "Anonymous";
        
        let cleanContent = content;
        try {
            JSON.parse(content);
        } catch (e) {
            cleanContent = DOMPurify.sanitize(content);
        }

        const post = await prisma.blog.create({
            data: {
                content: cleanContent,
                userId: userId,
                title: title.trim(),
                authorName: authorName
            },
            select: {id: true}
        });

        return res.status(201).json({
            message: "Blog posted successfully",
            data: {
                post
            }
        })
    } catch (error) {
        return res.status(500).json({message: "Error posting the blog"});
    }
}

export const updateBlog = async(req: Request, res: Response) => {
    const { newTitle, newContent, postId } = req.body;
    const userId = req.user.userId;

    if (!newTitle?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!newContent?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    try {
        const blog = await prisma.blog.findUnique({where: {id: postId}, select: {userId: true}});

        if(!blog){
            return res.status(404).json({ message: "Blog not found" });
        }

        if (blog.userId !== userId) {
          return res
            .status(403)
            .json({ message: "Not allowed to edit this blog" });
        }

        let cleanContent = newContent;
        try {
            JSON.parse(newContent);
        } catch (e) {
            cleanContent = DOMPurify.sanitize(newContent);
        }

        const updatedPost = await prisma.blog.update({
            where: {id: postId},
            data: {
                content: cleanContent,
                title: newTitle.trim()
            },
            select: {id: true}
        })

        return res.status(200).json({
          message: "Blog updated successfully",
          data: updatedPost
        });
    } catch (error) {
        console.error("Update blog error:", error);
        return res.status(500).json({ message: "Error updating the blog" });
    }
}

export const queryBlogById = async(req: Request, res: Response) => {
    const {postId} = req.params;
    const userId = req.user.userId;
    if(!postId){
        return res.status(400).json({message: "Post Id is required to fetch post"})
    }

    const blogId = Number(postId);
    if (isNaN(blogId)) {
      return res.status(400).json({ message: "Invalid postId" });
    }

    try {
        const blogPost = await prisma.blog.findUnique({
          where: { id: blogId },
          select: {
            title: true,
            content: true,
            userId: true,
            authorName: true,
            createdAt: true,
            updatedAt: true,
            _count: {select: {likes: true}},
            likes: { where: { userId }, select: { id: true } },
          },
        });

        if(!blogPost){
            return res.status(404).json({message: "Blog post not found!!"});
        }

        return res.status(200).json({
            message: "Blog post fetched successfully",
            data: {
                title: blogPost.title,
                content: blogPost.content,
                createdAt: blogPost.createdAt,
                updatedAt: blogPost.updatedAt,
                authorId: blogPost.userId,
                isLiked: blogPost.likes.length > 0,
                likesCount: blogPost._count,
                authorName: blogPost.authorName
            }
        })
    } catch (error) {
        return res.status(500).json({message: "Failed to fetch blog post"})
    }
}

export const queryPublicBlogById = async(req: Request, res: Response) => {
    const {postId} = req.params;
    if(!postId){
        return res.status(400).json({message: "Post Id is required to fetch post"})
    }

    const blogId = Number(postId);
    if (isNaN(blogId)) {
      return res.status(400).json({ message: "Invalid postId" });
    }

    try {
        const blogPost = await prisma.blog.findUnique({
          where: { id: blogId },
          select: {
            title: true,
            content: true,
            userId: true,
            authorName: true,
            createdAt: true,
            updatedAt: true,
            _count: {select: {likes: true}},
          },
        });

        if(!blogPost){
            return res.status(404).json({message: "Blog post not found!!"});
        }

        return res.status(200).json({
            message: "Blog post fetched successfully",
            data: {
                title: blogPost.title,
                content: blogPost.content,
                createdAt: blogPost.createdAt,
                updatedAt: blogPost.updatedAt,
                authorId: blogPost.userId,
                isLiked: false, // Public viewer cannot like
                likesCount: blogPost._count,
                authorName: blogPost.authorName
            }
        })
    } catch (error) {
        return res.status(500).json({message: "Failed to fetch blog post"})
    }
}

export const queryPopularBlogs = async(req: Request, res: Response) => {
    const {pageNum} = req.params;
    if (!pageNum) {
      return res
        .status(400)
        .json({ message: "Page Number is required to fetch posts" });
    }

    const pageNumber = Number(pageNum);
    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const limit = 10;
    const skip = (pageNumber - 1) * limit;

    try {
        const popularBlogPosts = await prisma.blog.findMany({
          orderBy: [
            {
              likes: {
                _count: "desc",
              },
            },
            {
              id: "desc",
            },
          ],
          skip,
          take: limit,
          select: {
            id: true,
            userId: true,
            title: true,
            authorName: true,
            createdAt: true,
            _count: {
              select: { likes: true },
            },
          },
        });

        const formattedData = popularBlogPosts.map(post => ({
          ...post,
          authorId: post.userId
        }));
        res.status(200).json({message: "Posts fetched successfully", data: formattedData, page: pageNumber})
    } catch (error) {
        res.status(400).json({message: "Error fetching blogPosts"});
    }
}

export const checkIfUserLikedBlog = async (req: Request, res: Response) => {
  const blogId = Number(req.params.blogId);
  const userId = req.user.userId;

  if (!blogId) {
    return res.status(400).json({ message: "Blog ID required" });
  }

  const liked = await prisma.like.findUnique({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
    select: { id: true },
  });

  res.status(200).json({
    liked: !!liked,
  });
};

export const countBlogsByAuthor = async (req: Request, res: Response) => {
  const authorId = Number(req.params.authorId);

  if (!authorId) {
    return res.status(400).json({ message: "Author ID required" });
  }

  const count = await prisma.blog.count({
    where: { userId: authorId },
  });

  res.status(200).json({
    totalBlogs: count,
  });
};

export const queryBlogsByAuthorId = async (req: Request, res: Response) => {
  const authorId = Number(req.params.authorId);

  if (!authorId || isNaN(Number(authorId))) {
    return res.status(400).json({ message: "Valid Author ID required" });
  }

  try {
    const authorBlogs = await prisma.blog.findMany({
      where: { userId: authorId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        authorName: true,
        _count: {
          select: { likes: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      message: "Blogs fetched successfully",
      data: authorBlogs,
    });
  } catch (error) {
    console.error("Error fetching author blogs:", error);
    return res.status(500).json({ message: "Error fetching blogs" });
  }
};

export const queryRecentBlogs = async(req: Request, res: Response) => {
  const { pageNum } = req.params;
  if (!pageNum) {
    return res
      .status(400)
      .json({ message: "Page Number is required to fetch posts" });
  }

  const pageNumber = Number(pageNum);
  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const limit = 10;
  const skip = (pageNumber - 1) * limit;

  try {
    const popularBlogPosts = await prisma.blog.findMany({
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: "desc",
        },
      ],
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        title: true,
        createdAt: true,
        authorName: true,
        _count: {
          select: { likes: true },
        },
      },
    });

    const formattedData = popularBlogPosts.map(post => ({
      ...post,
      authorId: post.userId
    }));

    res
      .status(200)
      .json({
        message: "Posts fetched successfully",
        data: formattedData,
        page: pageNumber,
      });
  } catch (error) {
    res.status(400).json({ message: "Error fetching blogPosts" });
  }
}

export const likeOnBlog = async(req: Request, res: Response) => {
  const userId = req.user.userId;
  const {blogId} = req.body;

  if(!blogId){
    return res.status(400).json("Blog Id is required!!");
  }

  try {
    const liked = await prisma.like.create({
      data: {
        userId: userId,
        blogId: blogId
      }
    });

    return res.status(201).json({message: "Blog post liked successfully"});
  } catch (error) {
    console.log("Error occurred: ", error);
    return res.status(500).json({message: "Error occurred liking the post"});
  }
}

export const commentOnBlog = async(req: Request, res: Response) => {
  const userId = req.user.userId;
  const { blogId, content, userName } = req.body;

  if (!blogId) {
    return res.status(400).json("Blog Id is required!!");
  }

  try {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    });
    
    const commentAuthorName = user?.name || "Anonymous";

    const liked = await prisma.comment.create({
      data: {
        userId: userId,
        blogId: blogId,
        userName: commentAuthorName,
        content: content
      },
    });

    return res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    console.log("Error occurred: ", error);
    return res.status(500).json({ message: "Error occurred liking the post" });
  }
}

export const queryAuthorsBlogs = async(req: Request, res: Response) => {
  const userId = req.user.userId;

  try {
    const authorBlogPosts = await prisma.blog.findMany({
      where: { userId: userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        authorName: true,
        _count: {
          select: { likes: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({message: "Blogs fetched successfully", data: authorBlogPosts});
  } catch (error) {
    console.log(error);
    return res.status(500).json({message: "Error fetching the blog posts"});
  }
}

export const deleteBlog = async(req: Request, res: Response) => {
  const userId = req.user.userId;
  const {blogId} = req.body;

  try {
    await prisma.blog.delete({where: {id: blogId, userId: userId}});

    return res.status(200).json({message: 'blog deleted successfully'});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error deleting the blog posts" });
  }
}

export const queryComments = async(req: Request, res: Response) => {
  const blogId = Number(req.params.blogId);


  try {
    const commentsOnPost = await prisma.comment.findMany({
        where: {blogId: blogId},
        select: {
            id: true,
            content: true,
            userName: true,
            userId: true,
            createdAt: true,
          },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return res.status(200).json({ message: "Comments fetched successfully", data: commentsOnPost });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(200).json({ message: "blog comments fetched successfully", data: [] });
  }
}

export const searchBlogs = async(req: Request, res: Response) => {
  const { q, page } = req.query;
  const query = q ? String(q) : "";
  const pageNumber = Number(page) || 1;

  if (pageNumber < 1) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const limit = 10;
  const skip = (pageNumber - 1) * limit;

  try {
    const searchResults = await prisma.blog.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { authorName: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        title: true,
        createdAt: true,
        authorName: true,
        _count: {
          select: { likes: true },
        },
      },
    });

    const formattedData = searchResults.map(post => ({
      ...post,
      authorId: post.userId
    }));

    res
      .status(200)
      .json({
        message: "Posts fetched successfully",
        data: formattedData,
        page: pageNumber,
      });
  } catch (error) {
    res.status(400).json({ message: "Error searching blogPosts" });
  }
}