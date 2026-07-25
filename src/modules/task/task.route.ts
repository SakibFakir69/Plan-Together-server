import { Router } from "express";
import { requireAuth } from "../../middlewares";
import { taskController } from "./task.controller";



const router = Router();

router.get('/', requireAuth, taskController.completeTask)
router.post('/',requireAuth,taskController.createTask)
router.delete('/', requireAuth, taskController.deleteTask)
router.put('/', requireAuth , taskController.updateTask)


export const taskRouter = router;