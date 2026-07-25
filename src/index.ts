import dotenv from 'dotenv';
dotenv.config();
import express from 'express';

import { userRouter } from './modules/users/user.route';
import { authRouter } from './modules/auth/auth.route';
import { GlobalErrorHandler } from './middlewares/global-error-hander';
import { workSpaceRouter } from './modules/workspace/workspace.route';
import { taskRouter } from './modules/task/task.route';
import swaggerDocs from './swagger-ui/swagger-ui-config';


const app= express();


// MIDDLEWARE
app.use(express.json())

// HACKER LESS KNOW ABOUT OUR STACK
app.disable('x-powered-by');

// SWAGGER DOCS
swaggerDocs(app)

// API
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/workspaces', workSpaceRouter);
app.use('/api/v1/tasks', taskRouter);

// NOT FOUNDED
app.use((req,res)=>{
    res.status(404).json({
        success:false,message:`This ${req.url}  Route not founded`
    })
})
// GlOBAL ERROR
app.use(GlobalErrorHandler);

// EXPORT APP
export default app;