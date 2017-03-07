'use strict';

const Hapi = require('hapi');
const fs = require('fs');


const server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});

server.route({
    method: 'GET',
    path: '/{name}',
    handler: function (request, reply) {
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});

server.route({
    method: 'POST',
    path: '/submit',
    config: {

        payload: {
            output: 'stream',
            parse: true,
            allow: 'multipart/form-data'
        },

        handler: function (request, reply) {
            var data = request.payload;
            console.log('POST /submit hit');
            console.log(data)
            if (data.file) {
                var name = data.file.hapi.filename;
                var path = __dirname + "/uploads/" + name;
                var file = fs.createWriteStream(path);

                file.on('error', function (err) { 
                    console.error(err) 
                });

                data.file.pipe(file);

                data.file.on('end', function (err) { 
                    var ret = {
                        filename: data.file.hapi.filename,
                        headers: data.file.hapi.headers
                    }
                    reply(JSON.stringify(ret));
                })
            }

        }
    }
});

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});