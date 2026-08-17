import type { RequestHandler } from "express";
import { clerkClient, getAuth } from "@clerk/express";

/**
 * Rejects any request without a signed-in Clerk session, and attaches the
 * resolved user (id/name/email) to `req.currentUser` so routes can attribute
 * requisitions, approvals, and audit events to a real person instead of a
 * placeholder string.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Unknown user";
    const primaryEmail = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );
    req.currentUser = {
      id: user.id,
      name,
      email: primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "",
    };
    next();
  } catch (error) {
    req.log?.error({ error }, "Failed to resolve the authenticated Clerk user");
    res.status(401).json({ error: "Unauthorized" });
  }
};
