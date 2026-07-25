

import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { TaskModel } from "./task.model";


export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { workspaceId } = req.params;
        const { title, description, category, assignedUser, dueDate, rewardPoints } = req.body;
        const createdBy = req.user?.id;
        

        if (!createdBy) {
            return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
        }

        if (!title || !category) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "title and category are required",
            });
        }

        const task = await TaskModel.create({
            workspaceId,
            title,
            description,
            category,
            assignedUser,
            createdBy,
            dueDate,
            rewardPoints: rewardPoints ?? 0,
        });

        return res.status(httpStatus.CREATED).json({
            success: true,
            message: "Task created successfully",
            data: task,
        });
    } catch (error) {
        next(error);
    }
};


export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { workspaceId } = req.params;
        const { category, isComplete, assignedUser } = req.query;

        const filter: Record<string, unknown> = { workspaceId };
        if (category) filter.category = category;
        if (isComplete !== undefined) filter.isComplete = isComplete === "true";
        if (assignedUser) filter.assignedUser = assignedUser;

        const tasks = await TaskModel.find(filter).sort({ dueDate: 1, createdAt: -1 });

        return res.status(httpStatus.OK).json({ success: true, data: tasks });
    } catch (error) {
        next(error);
    }
};


export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;
        const task = await TaskModel.findById(taskId);

        if (!task) {
            return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Task not found" });
        }

        return res.status(httpStatus.OK).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};


export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;
        const updates = req.body; // { title?, description?, category?, dueDate?, rewardPoints?, assignedUser? }

        const task = await TaskModel.findByIdAndUpdate(taskId, updates, {
            new: true,
            runValidators: true,
        });

        if (!task) {
            return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Task not found" });
        }

        return res.status(httpStatus.OK).json({ success: true, message: "Task updated", data: task });
    } catch (error) {
        next(error);
    }
};


export const assignTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;
        const { assignedUser } = req.body;

        if (!assignedUser) {
            return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "assignedUser is required" });
        }

        const task = await TaskModel.findByIdAndUpdate(
            taskId,
            { assignedUser },
            { new: true }
        );

        if (!task) {
            return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Task not found" });
        }

        return res.status(httpStatus.OK).json({ success: true, message: "Task assigned", data: task });
    } catch (error) {
        next(error);
    }
};


export const completeTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        

        const { taskId } = req.params;
        const completedBy = req.user?.id;

        if (!completedBy) {
            return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
        }

        const task = await TaskModel.findByIdAndUpdate(
            taskId,
            {
                isComplete: true,
                completedBy,
                completedAt: new Date(),
            },
            { new: true }
        );

        if (!task) {
            return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Task not found" });
        }

       

        return res.status(httpStatus.OK).json({ success: true, message: "Task completed", data: task });
    } catch (error) {
        next(error);
    }
};


export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;
        const task = await TaskModel.findByIdAndDelete(taskId);

        if (!task) {
            return res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Task not found" });
        }

        return res.status(httpStatus.OK).json({ success: true, message: "Task deleted" });
    } catch (error) {
        next(error);
    }
};


export const taskController ={
    createTask, deleteTask,updateTask,completeTask,assignTask
}