import Boom from '@hapi/boom'
import Hapi from '@hapi/hapi'

const projectPlugin = {
    name: 'app/project',
    version: '1.0.0',
    dependencies: ['prisma'],
    register: async function (server: Hapi.Server) {
        server.route([
            {
                method: 'GET',
                path: '/project',
                handler: getProjectHandler
            }
        ])
        server.route([
            {
                method: 'POST',
                path: '/project',
                handler: postProjectHandler
            }
        ])
    }
}

export default projectPlugin

interface ProjectInput {
    title: string,
    description: string
}

async function getProjectHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app

    try {
        const projects = await prisma.project.findMany({
            include: {
                user: true
            }
        })

        return h.response(projects).code(201)
    } catch (error) {
        return Boom.boomify(error)
    }
}

async function postProjectHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app
    const { title, description } = request.payload as ProjectInput
    const { userEmail } = h.request.auth.credentials as any

    try {
        const projects = await prisma.project.create({
            data: {
                title,
                description,
                user: {
                    connect: {
                        email: userEmail
                    }
                }
            }
        })

        return h.response(projects).code(201)
    } catch (error) {
        return Boom.boomify(error)
    }
}