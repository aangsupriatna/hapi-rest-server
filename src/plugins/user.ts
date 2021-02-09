import Boom from '@hapi/boom'
import Hapi from '@hapi/hapi'
import Joi from 'joi'
import Bcrypt from 'bcrypt'
import JWT from 'jsonwebtoken'

const userPlugin = {
    name: 'app/user',
    version: '1.0.0',
    dependencies: ['prisma'],
    register: async function (server: Hapi.Server) {
        server.route([
            {
                method: 'GET',
                path: '/user',
                options: {
                    auth: false
                },
                handler: getUserHandler
            }
        ])
        server.route([
            {
                method: 'POST',
                path: '/user',
                options: {
                    auth: false,
                    validate: {
                        payload: Joi.object({
                            email: Joi.string().email(),
                            password: Joi.string()
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
        request.log('error', error)
        return Boom.badImplementation(error)
    }
}

async function postUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app
    const { email, password } = request.payload as any

    try {
        const salt = await Bcrypt.genSaltSync(10)
        const encryptedPassword = await Bcrypt.hashSync(password, salt)
        const newUser = await prisma.user.create({
            data: {
                email,
                password: encryptedPassword
            }
        })
        const token = await JWT.sign({ id: newUser.id }, 'NeverShareYourSecret', { expiresIn: '1d' })
        return h.response(token).code(201)
    } catch (error) {
        request.log('error', error)
        return Boom.badData(error)
    }
}

async function putUserHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app
    const userId = request.params.userId
    const { name, email, password, isAdmin } = request.payload as any

    try {
        const updUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                name,
                email,
                password,
                isAdmin: Boolean(isAdmin)
            }
        })
        return h.response(updUser).code(200)
    } catch (error) {
        request.log('error', error)
        return Boom.boomify(error)
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
        request.log('error', error)
        return Boom.badData(error)
    }
}