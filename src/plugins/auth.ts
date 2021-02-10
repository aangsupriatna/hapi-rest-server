import jwt from 'jsonwebtoken'
import Hapi from '@hapi/hapi'
import Boom from '@hapi/boom'
import Joi from 'joi'
import Bcrypt from 'bcrypt'
import Moment, { now } from 'moment'

interface APITokenPayload {
    tokenId: number
}

const authPlugin = {
    name: 'app/auth',
    dependencies: ['prisma', 'hapi-auth-jwt2'],
    register: async function (server: Hapi.Server) {
        server.auth.strategy('jwt', 'jwt', {
            key: 'NeverShareYourSecret',
            validate: validateAuth,
            verifyOptions: { algorithms: ['HS256'] }
        })

        server.route([
            {
                method: 'POST',
                path: '/signin',
                options: {
                    auth: false,
                    validate: {
                        payload: Joi.object({
                            email: Joi.string().email().required(),
                            password: Joi.string().required()
                        })
                    }
                },
                handler: postSignInHandler,
            }
        ])

        server.route([
            {
                method: 'POST',
                path: '/signout',
                handler: postSignOutHandler,
            }
        ])

        server.auth.default('jwt')
    }
}

const validateAuth = async (decoded: APITokenPayload, request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { prisma } = request.server.app
    const { tokenId } = decoded

    try {
        const userToken = await prisma.token.findUnique({
            where: {
                id: tokenId
            },
            include: {
                user: true
            }
        })

        if (!userToken || !userToken?.valid) {
            return { isValid: false, errorMessage: 'Invalid token' }
        }

        if (userToken.expirationDate < new Date()) {
            return { isValid: false, errorMessage: 'Token expired' }
        }
        return {
            isValid: true,
            credentials: {
                tokenId: decoded.tokenId,
                userId: userToken.userId,
                userEmail: userToken.user?.email,
                isAdmin: userToken.user?.isAdmin,
            },
        }

    } catch (error) {
        return { isValid: false, errorMessage: 'DB Error' }
    }
}

export default authPlugin

interface LoginInput {
    email: string,
    password: string
}

const cookieOptions = {
    ttl: 365 * 24 * 60 * 60 * 1000,
    isSecure: false,
    isHttpOnly: true,
    clearInvalid: false,
    strictHeader: true,
    path: '/'
}

const JWT_SECRET = process.env.JWT_TOKEN_SECRET || 'SUPER_SECRET_JWT_SECRET'

async function postSignInHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app
    const { email, password } = request.payload as LoginInput

    try {
        const user = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (!user) {
            return Boom.unauthorized('Get out')
        }

        const validUser = user && (await Bcrypt.compareSync(password, user.password))

        if (validUser) {

            const createToken = await prisma.token.create({
                data: {
                    valid: true,
                    expirationDate: Moment().add(30, 'd').toDate(),
                    user: {
                        connect: {
                            email
                        }
                    }
                }
            })
            const authToken = await jwt.sign({
                tokenId: createToken.id
            }, JWT_SECRET)

            return h.response({ authToken }).code(200).state('token', authToken, cookieOptions)
        } else {
            return Boom.unauthorized('Wrong credentials')
        }

    } catch (error) {
        return Boom.boomify(error)
    }
}

async function postSignOutHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const { prisma } = request.server.app
    const { tokenId } = h.request.auth.credentials
    try {
        const token = await prisma.token.update({
            where: {
                id: Number(tokenId)
            },
            data: {
                valid: false,
                expirationDate: new Date(now())
            }
        })

        return h.response(token).code(201)
        // return h.response(token).unstate('token')
    } catch (error) {
        return Boom.boomify(error)
    }
}