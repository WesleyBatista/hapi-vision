'use strict';
require('dotenv').config();
const Hapi = require('hapi');
const fs = require('fs');
const storage = require('@google-cloud/storage');
const server = new Hapi.Server();

server.connection({ port: process.env.PORT || 5002 });

const PROJECT_ID = process.env.PROJECT_ID;
const PROJECT_JSON_KEY = process.env.PROJECT_JSON_KEY;
const PROJECT_BUCKET = process.env.PROJECT_BUCKET;

const CLIENT_CREDENTIALS = {
  projectId: PROJECT_ID,
  keyFilename: PROJECT_JSON_KEY
};
const gcs = storage(CLIENT_CREDENTIALS);
const bucket = gcs.bucket(PROJECT_BUCKET);



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

			function getPublicUrl (filename) {
			  return `https://storage.googleapis.com/${PROJECT_BUCKET}/${filename}`;
			}

            var data = request.payload;
            if (data.file) {

            	var name = data.file.hapi.filename;

				var fileName = 'images/'+name;

				var file = bucket.file(fileName);
				
				const stream = file.createWriteStream({
					metadata: {
						contentType: data.file.hapi.headers["content-type"]
					}
				});

				  stream.on('error', (err) => {
				    data.cloudStorageError = err;
				    reply(JSON.stringify(err));
				  });
				
				  stream.on('finish', () => {
				    data.cloudStorageObject = fileName;
				    data.cloudStoragePublicUrl = getPublicUrl(fileName);
                    var ret = {
                        filename: data.file.hapi.filename,
                        headers: data.file.hapi.headers,
                        downloadUrl: getPublicUrl(fileName)
                    }
                    reply(JSON.stringify(ret));
				  });

				  stream.end(data.file._data);
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