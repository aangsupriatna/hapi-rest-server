import Hapi from '@hapi/hapi'
import Joi from 'joi'

const userPlugin = {
    name: 'app/user',
    version: '1.0.0',
    dependencies: ['prisma'],
    register: async function (server: Hapi.Server) {
        server.route([
            {
                method: 'GET',
                path: '/user',
                handler: getUserHandler
            }
        ])
        server.route([
            {
                method: 'POST',
                path: '/user',
                options: {
                    validate: {
                        payload: Joi.object({
                            name: Joi.string().min(1).max(50),
                            email: Joi.string().email()
                        })
                    }
                },
                handler: postUserHandler,
            }
        ])
        server.route([
            {
                method: 'PUT',
                path: '/user/{userId}',
                options: {
                    validate: {
                        params: Joi.object({
                            userId: Joi.number().integer()
                        })
                    }
                },
                handler: putUserHandler
            }
        ])
        server.route([
            {
                method: 'DELETE',
                path: '/user/{userId}',
                options: {
                    validate: {
                        params: Joi.object({
                            userId: Joi.number().integer()
                        })
                    }
                },
                handler: deleteUserHandler
            }
        ])
    }
}

export default userPlugin

async function getUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app

    try {
        const users = await prisma.user.findMany()
        return h.response(users).code(201)
    } catch (error) {
        console.log(error)
    }
}

async function postUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app
    const { name, email } = request.payload as any

    try {
        const newUser = await prisma.user.create({
            data: {
                name,
                email
            }
        })
        return h.response(newUser).code(201)
    } catch (error) {
        console.log(error)
    }
}

async function putUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app
    const userId = request.params.userId
    const { name, email, isAdmin } = request.payload as any

    try {
        const updUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                name,
                email,
                isAdmin: Boolean(isAdmin)
            }
        })
        return h.response(updUser).code(200)
    } catch (error) {
        console.log(error)
    }
}

async function deleteUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app
    const userId = request.params.userId

    try {
        const delUser = await prisma.user.delete({
            where: {
                id: userId
            }
        })
        return h.response(delUser).code(200)
    } catch (error) {
        console.log(error)
    }
}