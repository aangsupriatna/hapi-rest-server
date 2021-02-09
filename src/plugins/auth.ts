import jwt from 'jsonwebtoken'
import Hapi from '@hapi/hapi'
import Boom from '@hapi/boom'
import Joi from 'joi'
import Bcrypt from 'bcrypt'
import Moment from 'moment'

interface APITokenPayload {
    tokenId: number
}

const authPlugin = {
    name: 'app/auth',
    dependencies: ['prisma', 'hapi-auth-jwt2'],
    register: async function (server: Hapi.Server) {
        server.auth.strategy('jwt', 'jwt', {
            key: 'NeverShareYourSecret',
            validate: validate,
            verifyOptions: { algorithms: ['HS256'] }
        })

        server.route([
            {
                method: 'POST',
                path: '/login',
                options: {
                    auth: false,
                    validate: {
                        payload: Joi.object({
                            email: Joi.string().email(),
                            password: Joi.string()
                        })
                    }
                },
                handler: postLoginHandler,
            }
        ])

        server.auth.default('jwt')
    }
}

const validate = async (decoded: APITokenPayload, request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { prisma } = request.server.app
    const { tokenId } = decoded

    console.log('Decoded token: ' + JSON.stringify(decoded))
    try {
        const userToken = await prisma.token.findUnique({
            where: {
                id: tokenId
            },
            include: {
                user: true
            }
        })
        console.log('userToken: ' + JSON.stringify(userToken))

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

async function postLoginHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
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
            }, 'NeverShareYourSecret')

            return h.response().code(200).header('Authorization', authToken)
            // return h.response({ token }).code(201)
        } else {
            return Boom.unauthorized('Wrong credentials')
        }

    } catch (error) {
        return Boom.boomify(error)
    }
}