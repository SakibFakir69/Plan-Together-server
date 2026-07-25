import { Application, Request, Response } from 'express'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'



const options = {


    definition: {

        openapi: '3.0.0',

        info: {
            title: 'PlanTogether Server',
            description: "API endpoints for plantogther documented on swagger",
            contact: {
                name: "Sakib Fakir",
                email: "sakibfakir749@gmail.com",
                url: "https://github.com/SakibFakir69/Plan-Together-server"
            },
            version: '1.0.0',
        },
        servers: [
            {
                url: "http://localhost:5000/",
                description: "Local server"
            },
            {
                url: "<your live url here>",
                description: "Live server"
            },
        ]
    },
   
    apis:['./../modules/**/*.ts']

}
const swaggerSpec = swaggerJsdoc(options)
function swaggerDocs(app:Application) {
    // Swagger Page
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
    // Documentation in JSON format
    app.get('/docs.json', (req:Request, res:Response) => {
        res.setHeader('Content-Type', 'application/json')
        res.send(swaggerSpec)
    })
}
export default swaggerDocs