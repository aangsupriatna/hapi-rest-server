import Hapi from '@hapi/hapi'
import Joi from 'joi'

const helloPlugin = {
    name: 'app/hello',
    version: '1.0.0',
    register: async function (server: Hapi.Server) {
        server.route([
            {
                method: 'GET',
                path: '/hello',
                handler: getHelloHandler
            }
        ])
        server.route([
            {
                method: 'POST',
                path: '/hello',
                options: {
                    validate: {
                        payload: Joi.object({
                            username: Joi.string().min(1).max(20),
                            password: Joi.string().min(7)
                        })
                    }
                },
                handler: postHelloHandler,
            }
        ])
        server.route([
            {
                method: 'PUT',
                path: '/hello/{helloId}',
                options: {
                    validate: {
                        params: Joi.object({
                            helloId: Joi.number().integer()
                        })
                    }
                },
                handler: putHelloHandler
            }
        ])
        server.route([
            {
                method: 'DELETE',
                path: '/hello/{helloId}',
                options: {
                    validate: {
                        params: Joi.object({
                            helloId: Joi.number().integer()
                        })
                    }
                },
                handler: deleteHelloHandler
            }
        ])
    }
}

async function getHelloHandler(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> {
    return h.response('hello, world')
}

async function postHelloHandler(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> {
    const payload = request.payload as any
    return h.response(payload).code(200)
}

async function putHelloHandler(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> {
    const helloId = request.params.helloId
    return h.response(`Update hello with id ${helloId}`).code(200)
}

async function deleteHelloHandler(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> {
    const helloId = request.params.helloId
    return h.response(`Delete hello with id ${helloId}`).code(200)
}

export default helloPlugin