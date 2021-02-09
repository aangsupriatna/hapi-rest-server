import Hapi from '@hapi/hapi'
import dotenv from 'dotenv'
import helloPlugin from './plugins/hello'

dotenv.config()

const server: Hapi.Server = new Hapi.Server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
})

export async function start(): Promise<Hapi.Server> {
    await server.register([
        helloPlugin
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