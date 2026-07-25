import type { NextFunction, Request, Response } from "express";
import { workSpaceEnum } from "./workspace.interface";
import { createWorkspaceValidation, updateWorkspaceValidation } from "./workspace.validation";
import { WorkspaceModel } from "./workspace.model";
import httpStatus from "http-status";
import { generateInviteCode } from "../../utils/genrate-invite-code";
import { FAMILY_DEFAULT_CATEGORIES, STUDENT_DEFAULT_CATEGORIES } from "../../constant/workspace/constant.workspace";
import { getIo } from "../../config/socket/socket.config";



 
const createWorkSpace = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const parsedData = createWorkspaceValidation.parse({
            body: req.body,
        });
 
        const { name, description, type, isPrivate, inviteCode } =
            parsedData.body;
 
        const ownerId = req.user?.id;
 
        if (!ownerId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
            });
        }
 
        const finalInviteCode = inviteCode ?? generateInviteCode();
 
        // Guard against invite code collisions
        const existing = await WorkspaceModel.findOne({
            inviteCode: finalInviteCode,
        });
        if (existing) {
            return res.status(httpStatus.CONFLICT).json({
                success: false,
                message: "Invite code already in use, please try again.",
            });
        }
 
        const basePayload = {
            name,
            description,
            isPrivate: isPrivate ?? false,
            inviteCode: finalInviteCode,
            ownerId: ownerId,
            members: [{ user: ownerId, role: "admin" as const, joinedAt: new Date() }],
        };
 
        let workspace;
 
        if (type === workSpaceEnum.family) {
            workspace = await WorkspaceModel.create({
                ...basePayload,
                type: workSpaceEnum.family,
                categories: FAMILY_DEFAULT_CATEGORIES
               
            });
        } else if (type === workSpaceEnum.student) {
            workspace = await WorkspaceModel.create({
                ...basePayload,
                type: workSpaceEnum.student,
                categories: STUDENT_DEFAULT_CATEGORIES,
               
            });
        } else {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Invalid workspace type.",
            });
        }

   

        return res.status(httpStatus.CREATED).json({
            success: true,
            message: "Workspace created successfully",
            data: workspace,
        });
    } catch (error) {
        next(error);
    }
};



const updateWorkSpace = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
            });
        }
    

        const parsedData = updateWorkspaceValidation.parse({ body: req.body });
        const { name, description, isPrivate } = parsedData.body;
      

        const workspace = await WorkspaceModel.findById(workspaceId);
        if (!workspace) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "Workspace not found",
            });
        }

        const isAdmin = workspace.members.some(
            (m) => m.user.toString() === userId.toString() && m.role === "admin"
        );
        if (!isAdmin) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: "Only admins can update this workspace",
            });
        }

        if (name !== undefined) workspace.name = name;
        if (description !== undefined) workspace.description = description;
        if (isPrivate !== undefined) workspace.isPrivate = isPrivate;


        

        await workspace.save();
      
        return res.status(httpStatus.OK).json({
            success: true,
            message: "Workspace updated successfully",
            data: workspace,
        });
    } catch (error) {
        next(error);
    }
};


const deleteWorkSpace = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!workspaceId) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Workspace id is required",
            });
        }

        const workspace = await WorkspaceModel.findById(workspaceId);
        if (!workspace) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "Workspace not found",
            });
        }

        const isOwner = workspace.ownerId.toString() === userId.toString();
        if (!isOwner) {
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: "Only the owner can delete this workspace",
            });
        }

        await WorkspaceModel.findByIdAndDelete(workspaceId);

        

        return res.status(httpStatus.OK).json({
            success: true,
            message: "Workspace deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};


const joinWorkspaceByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    const workspace = await WorkspaceModel.findOne({ inviteCode });
    if (!workspace) {
      return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Invalid invite code" });
    }

    // already a member?
    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === userId
    );
    if (alreadyMember) {
      return res.status(httpStatus.OK).json({ success: true, message: "Already a member", data: workspace });
    }

    if (workspace.isPrivate) {
      // private workspace -> create a pending join request instead of adding directly
      

      // notify owner in real time
      

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Join request sent, waiting for approval",
      });
    }

    // public workspace -> add immediately
    workspace.members.push({ user: userId, role: "user" });
    await workspace.save();

    // tell everyone currently in the workspace room that someone joined
   

    return res.status(httpStatus.OK).json({
      success: true,
      message: "Joined workspace successfully",
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

const getMyAllWorkSpace = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const myWorkspaces = await WorkspaceModel.find({
            "members.user": userId,
        }).lean();

        return res.status(httpStatus.OK).json({
            success: true,
            data: myWorkspaces,
        });
    } catch (error) {
        next(error);
    }
};


export const workSpaceController = {
    createWorkSpace, updateWorkSpace, deleteWorkSpace,getMyAllWorkSpace,joinWorkspaceByCode
};