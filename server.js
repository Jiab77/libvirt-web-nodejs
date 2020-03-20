/*
Made by: Jiab77 <https://github.com/Jiab77/libvirt-web>

Based on:
 - https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework
 - https://blog.bloomca.me/2018/12/22/writing-a-web-server-node.html
 - https://nodejs.org/en/docs/guides/getting-started-guide/
 - https://www.w3schools.com/nodejs/nodejs_http.asp
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const process = require('process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const execFile = util.promisify(require('child_process').execFile);

const hostname = '127.0.0.1';
const port = process.env.LIBVIRT_WEB_PORT || 8001;

http.createServer(function (request, response) {
	const { query } = require('url').parse(request.url, true);

	const tools = {
		extractData: function (line, delim) {
			line = String(line).trim();
			let rawData = line.split(delim);
			let data = rawData.filter(function (el) {
				// return String(el).replace(/(\r\n|\n|\r)/gm,"");
				return String(el).trim();
			});
			return data;
		},
		parseData: function (output, delim, callback) {
			const skipLines = 2;
			let rawHeaders = [];
			let parsed = [];
			const lines = output.split(/[\r\n|\n]/);

			// for (let i = 0; i < lines.length; i++) {
			for (let i = 0; i < 1; i++) {
				if (i === 0) {
					let line = lines[i].split('  ');
					if (line.length > 0) {
						rawHeaders[i] = line.filter(function(e){return e});
					}
				}
			}
	
			for (let j = 0; j < lines.length; j++) {
				if (j >= skipLines && lines[j] !== '') {
					let extractedData = this.extractData(lines[j], delim);
					let newObj = {};
					for (let k = 0; k < extractedData.length; k++) {
						for (let l = 0; l < rawHeaders.length; l++) {
							newObj[String(rawHeaders[l][k]).trim()] = String(extractedData[k]).trim();
						}
					}
					// console.log('newObj:', newObj);
					parsed.push(newObj);
				}
			}
	
			if (parsed.length > 0) {
				console.table(parsed);
			}
			else {
				console.log('Nothing to parse.');
			}
	
			if (callback && typeof(callback) === "function") {
				callback(response, (parsed.length > 0 ? parsed : []));
			}
		},
		printJSON: function (response, data) {
			response.writeHead(200, {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			});

			let newObj;
			if (data.length > 0) {
				newObj = {
					result: data,
					count: data.length,
					message: 'success'
				};
			}
			else {
				newObj = {
					result: data,
					count: data.length,
					message: 'no data'
				}
			}
			response.write(JSON.stringify(newObj));
			response.end();
		}
	};

	console.log('Request:', request.url);

	if (query.key !== undefined) {
		console.log('Query:', query.key);
	}

	var filePath = '.' + request.url;
	if (filePath === './') {
		filePath = './index.html';
	}

	var extname = String(path.extname(filePath)).toLowerCase();
	var mimeTypes = {
		'.html': 'text/html',
		'.js': 'text/javascript',
		'.css': 'text/css',
		'.json': 'application/json',
		'.png': 'image/png',
		'.jpg': 'image/jpg',
		'.gif': 'image/gif',
		'.svg': 'image/svg+xml',
		'.wav': 'audio/wav',
		'.mp4': 'video/mp4',
		'.woff': 'application/font-woff',
		'.ttf': 'application/font-ttf',
		'.eot': 'application/vnd.ms-fontobject',
		'.otf': 'application/font-otf',
		'.wasm': 'application/wasm'
	};

	var contentType = mimeTypes[extname] || 'application/octet-stream';

	// log served headers
	request.on('response', (headers, flags) => {
		for (const name in headers) {
			console.log(`${name}: ${headers[name]}`);
		}
	});

	if (request.url === '/json') {
		if (request.method === "POST") {
			let data = '';

			request.on('data', chunk => {
				data += chunk;
			});
		
			request.on('end', () => {
				try {
					const requestData = JSON.parse(data);
					requestData.message = "success";
					response.setHeader('Content-Type', 'application/json');
					response.end(JSON.stringify(requestData));
				} catch (error) {
					response.statusCode = 400;
					response.end('Invalid JSON');
					console.error('Invalid JSON received.', error);
				}
			});
		}
		else {
			/* response.statusCode = 400;
			response.end('Unsupported method, please POST a JSON object'); */

			try {
				response.writeHead(200, { 'Content-Type': 'application/json' });
				response.write(JSON.stringify({ message: 'Hello World' }));
				response.end();
			} catch (error) {
				response.statusCode = 500;
				response.end('Unexpected error.');
				console.error('Unexpected error.', error);
			}
		}

	}
	else {
		// log served response
		console.log('Served:', request.url);

		// Routes
		switch (request.url) {
			case '/info':
				// set response header
				response.writeHead(200, { 'Content-Type': 'text/html' });

				// set response content
				response.write('<html><body><p>This is info page. <a href="#" onclick="window.history.back();">Back</a></p></body></html>');
				response.end();
				break;

			case '/filters':
				try {
					async function getNetworkFilters() {
						const { stdout,stderr } = await execFile('virsh', ['nwfilter-list']);
						console.log('[Info] Found network filters:\n', stdout);
						if (stderr !== '') {
							console.log('[Debug]', stderr);
						}
						tools.parseData(stdout, '  ', tools.printJSON);
					}

					getNetworkFilters();
				} catch (error) {
					response.statusCode = 500;
					response.end('Unexpected error.');
					console.error('Unexpected error.', error);
				}
				break;

			case '/leases':
				try {
					async function getNetworkLeases(network) {
						const { stdout,stderr } = await execFile('virsh', ['net-dhcp-leases', network]);
						console.log('[Info] Found allocated leases:\n', stdout);
						if (stderr !== '') {
							console.log('[Debug]', stderr);
						}
						tools.parseData(stdout, '  ', tools.printJSON);
					}

					getNetworkLeases('default');
				} catch (error) {
					response.statusCode = 500;
					response.end('Unexpected error.');
					console.error('Unexpected error.', error);
				}
				break;

			case '/machines':
				try {
					async function getVirtualMachines() {
						const { stdout,stderr } = await execFile('virsh', ['list', '--all']);
						console.log('[Info] Found virtual machines:\n', stdout);
						if (stderr !== '') {
							console.log('[Debug]', stderr);
						}
						tools.parseData(stdout, '  ', tools.printJSON);
					}

					getVirtualMachines();
				} catch (error) {
					response.statusCode = 500;
					response.end('Unexpected error.');
					console.error('Unexpected error.', error);
				}
				break;

			case '/networks':
				try {
					async function getVirtualNetworks() {
						const { stdout,stderr } = await execFile('virsh', ['net-list', '--all']);
						console.log('[Info] Found virtual networks:\n', stdout);
						if (stderr !== '') {
							console.log('[Debug]', stderr);
						}
						tools.parseData(stdout, '  ', tools.printJSON);
					}

					getVirtualNetworks();
				} catch (error) {
					response.statusCode = 500;
					response.end('Unexpected error.');
					console.error('Unexpected error.', error);
				}
				break;

			case '/pools':
				try {
					async function getStoragePools() {
						const { stdout,stderr } = await execFile('virsh', ['pool-list', '--details']);
						console.log('[Info] Found storage pools:\n', stdout);
						if (stderr !== '') {
							console.log('[Debug]', stderr);
						}
						tools.parseData(stdout, '  ', tools.printJSON);
					}

					getStoragePools();
				} catch (error) {
					response.statusCode = 500;
					response.end('Unexpected error.');
					console.error('Unexpected error.', error);
				}
				break;

			case '/volumes':
				try {
					async function getVolumes(pool) {
						const { stdout,stderr } = await execFile('virsh', ['vol-list', pool, '--details']);
						console.log('[Info] Found volumes:\n', stdout);
						if (stderr !== '') {
							console.log('[Debug]', stderr);
						}
						tools.parseData(stdout, '  ', tools.printJSON);
					}

					getVolumes('default');
				} catch (error) {
					response.statusCode = 500;
					response.end('Unexpected error.');
					console.error('Unexpected error.', error);
				}
				break;
		
			default:
				// Serve static files
				fs.readFile(filePath, function(error, content) {
					if (error) {
						if(error.code == 'ENOENT') {
							fs.readFile('./404.html', function(error, content) {
								response.writeHead(404, { 'Content-Type': 'text/html' });
								response.end(content, 'utf-8');
							});
						}
						else {
							response.writeHead(500);
							response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
						}
					}
					else {
						response.writeHead(200, { 'Content-Type': contentType });
						response.end(content, 'utf-8');
					}
				});
				break;
		}
	}

}).listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});