import { Request, Response, NextFunction } from "express";
import { getPermissionsFromZeva } from "../services/permission.service";
import { successResponse } from "../utils/apiResponse";
import { getUserById } from "../services/auth.service";

export const getPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { module, subModule } = req.query as {
      module: string;
      subModule: string;
    };
    const { id: userId } = req.user!;

    const user = await getUserById(userId);

    if (!user.zevaUserId) {
      return next(new Error("User not found"));
    }
    const permissions = await getPermissionsFromZeva({
      module,
      subModule,
      userId: user.zevaUserId,
    });
    return successResponse(
      res,
      200,
      "Permissions retrieved successfully",
      permissions,
    );
  } catch (error) {
    next(error);
  }
};
