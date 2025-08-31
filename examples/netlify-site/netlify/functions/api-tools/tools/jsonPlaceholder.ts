import { ToolHandler, ToolMetadata } from "netlify-function-mcp";

export const metadata: ToolMetadata = {
  description: "Fetches a blog post from JSONPlaceholder API by ID",
  inputSchema: {
    type: "object",
    properties: {
      postId: {
        type: "number",
        description: "The ID of the post to fetch (1-100)",
        minimum: 1,
        maximum: 100
      }
    },
    required: ["postId"]
  }
};

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export const handler: ToolHandler = async (params: { postId: number }) => {
  try {
    // Validate the postId parameter
    if (!params.postId || typeof params.postId !== 'number') {
      throw new Error("postId must be a number");
    }

    if (params.postId < 1 || params.postId > 100) {
      throw new Error("postId must be between 1 and 100");
    }

    // Make the API request to JSONPlaceholder
    const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${params.postId}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status} ${response.statusText}`);
    }

    const post = await response.json() as Post;

    // Return the post data with some additional metadata
    return {
      success: true,
      post: {
        id: post.id,
        userId: post.userId,
        title: post.title,
        body: post.body,
        wordCount: post.body.split(/\s+/).length,
        preview: post.body.substring(0, 100) + (post.body.length > 100 ? "..." : "")
      },
      source: "JSONPlaceholder API",
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      postId: params.postId,
      timestamp: new Date().toISOString()
    };
  }
};