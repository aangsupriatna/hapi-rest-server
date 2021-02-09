import Hapi from '@hapi/hapi'
import hapiAuthJWT from 'hapi-auth-jwt2'
import dotenv from 'dotenv'
import prisma from './plugins/prisma'
import auth from './plugins/auth'
import user from './plugins/user'

dotenv.config()

const server: Hapi.Server = new Hapi.Server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
})

export async function start(): Promise<Hapi.Server> {
    await server.register([
        hapiAuthJWT,
        prisma,
        auth,
        user
    ], {
        routes: {
            prefix: '/api'
        }
    })
    await server.start()
    return server
}

process.on('unhandledRejection', async (err) => {
    console.log(err)
    process.exit(1)
})

start()
    .then((server) => {
        console.log(
            `🚀 Server ready at: ${server.info.uri}`,
        )
    })
    .catch((err) => {
        console.log(err)
    })