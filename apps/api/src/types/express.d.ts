import "express";

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth after resolving the Clerk session to a user. */
      currentUser?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}
