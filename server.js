/*
Made by: Jiab77 <https://github.com/Jiab77/libvirt-web>

Based on:
 - https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework
 - https://blog.bloomca.me/2018/12/22/writing-a-web-server-node.html
 - https://nodejs.org/en/docs/guides/getting-started-guide/
 - https://www.w3schools.com/nodejs/nodejs_http.asp
*/

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const process = require('process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const execFile = util.promisify(require('child_process').execFile);
const ppmbin = require('ppm-bin');

const hostname = process.env.LIBVIRT_WEB_HOST || '127.0.0.1';
const port = process.env.LIBVIRT_WEB_PORT || 8001;
const routes = ['/json', '/info', '/capture', '/filters', '/leases', '/machines', '/networks', '/pools', '/volumes'];
const tools = {
	response: null,
	setServerResponse: function (response) {
		console.log('[Debug] Storing server response.', response);
		tools.response = response;
	},
	getServerResponse: function () {
		return tools.response;
	},
	cbImageAsBase64: function (err, data) {
		if (err) {
			console.error(err);
		}
		else {
			tools.imageAsBase64(data, tools.cbPrintHTML);
		}
	},
	cbPrintHTML: function (err, data) {
		if (err) {
			console.error(err);
		}
		else {
			tools.printHTML(data);
		}
	},
	cbPrintJSON: function (err, data) {
		if (err) {
			console.error(err);
		}
		else {
			tools.printJSON(data);
		}
	},
	PPM2PNG: async function(image, callback) {
		if (!image) return false;
		const newImage = image + '.png';
		return ppmbin.convert(image, newImage, function (err) {
			if (err) {
				console.error(err);
				return
			}
			else {
				console.log('[Info] Converting ' + image + ' to ' + image + '.png...');

				if (callback && typeof(callback) === "function") {
					console.log('[Debug] Executing callback.', callback);
					callback(err, newImage);
				}
				else {
					return newImage;
				}
			}
		})
	},
	extractData: function (line, delim) {
		line = String(line).trim();
		let rawData = line.split(delim);
		let data = rawData.filter(function (el) {
			// return String(el).replace(/(\r\n|\n|\r)/gm,"");
			return String(el).trim();
		});
		return data;
	},
	imageAsBase64: function (image, callback) {
		if (!image) {
			const error = 'Missing [image] argument.';
			console.error(error);
		}
		else {
			console.log('[Info] Converting ' + image + ' to base64...');
			// const newImageBase64 = fs.readFileSync(image, 'base64');
			fs.readFile(image, 'base64', function (err, data) {
				console.log('[Info] Converted.');
				console.log('[Debug] Creating HTML string...');
				const str = '<img src="data:image/png;base64,' + data + '">';
				if (callback && typeof callback === 'function') {
					console.log('[Debug] Executing callback.', callback);
					callback(err, str);
				}
				else {
					return data;
				}
			});
		}
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
			console.log('[Debug] Generated table:');
			console.table(parsed);
		}
		else {
			console.log('Nothing to parse.');
		}

		if (callback && typeof(callback) === "function") {
			console.log('[Debug] Executing callback.', callback);
			callback(null, (parsed.length > 0 ? parsed : []));
		}
		else {
			return (parsed.length > 0 ? parsed : []);
		}
	},
	printHTML: function (data, callback) {
		if (!data) {
			const error = 'Missing data argument.'
			console.error(error);
		}
		else {
			const response = this.getServerResponse();

			console.log('[Info] Printing HTML...');
			response.writeHead(200, { 'Content-Type': 'text/html' });
			// response.write('<html><body>' + data + '</body></html>');
			response.write(data);
			response.end();
		}

		if (callback && typeof callback === 'function') {
			console.log('[Debug] Executing callback.', callback);
			callback(error, data);
		}
	},
	printJSON: function (data, callback) {
		if (!data) {
			const error = 'Missing data argument.';
			console.error(error);
		}
		else {
			const response = this.getServerResponse();

			console.log('[Info] Printing JSON...');
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

		if (callback && typeof callback === 'function') {
			console.log('[Debug] Executing callback.', callback);
			callback(error, data);
		}
	}
};

http.createServer(function (request, response) {
	const q = url.parse(request.url, true);
	const query = q.query;
	const URL = q.pathname;

	// Clear console on each requests
	// console.clear();

	// Debug server request
	console.log('[Debug] Analysing request.');
	console.table(q);

	if (query.length > 0) {
		console.log('[Debug] Found querystring:', q.search);
	}
	
	console.log('[Info] Request:', URL);
	if (query.length > 0) {
		console.log('[Info] Query:', query);
	}

	var filePath = '.' + URL;
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
	/* console.log('[Debug] Request / Response:', request, response);
	this.on('response', (headers, flags) => {
		console.log('[Debug] Response:', this);
		for (const name in headers) {
			console.log(`${name}: ${headers[name]}`);
		}
	}); */

	// Routes
	if (routes.includes(URL)) {
		// Confirm authorized route
		console.log('[Info] Serving authorized route:', URL);

		// Share server response to the tools class
		tools.setServerResponse(response);

		// Actions per route
		switch (URL) {
			case '/json':
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
					response.statusCode = 400;
					response.end('Unsupported method. You should use POST instead.');
		
					/* try {
						response.writeHead(200, { 'Content-Type': 'application/json' });
						response.write(JSON.stringify({ message: 'Hello World' }));
						response.end();
					} catch (error) {
						response.statusCode = 500;
						response.end('Unexpected error.');
						console.error('Unexpected error.', error);
					} */
				}
				break;
	
			case '/info':
				// set response header
				response.writeHead(200, { 'Content-Type': 'text/html' });
	
				// set response content
				response.write('<html><body><p>This is info page. <a href="#" onclick="window.history.back();">Back</a></p></body></html>');
				response.end();
				break;
	
			case '/capture':
				try {
					async function getVMScreenshot(vm) {
						// virsh screenshot ' . $vm_name . ' --file ' . $input_image . ' --screen 0
						const outputFile = '/tmp/vm_screen.ppm'
						const { stdout,stderr } = await execFile('virsh', ['screenshot', 'popos18.04-work', '--file', outputFile, '--screen', '0']);
						if (vm) {
							console.log('[Info] Target VM:', vm);
						}
						console.log('[Info] Got VM screenshot:\n', stdout);
						if (stderr !== '') {
							console.log('[Debug]', stderr);
						}
						tools.PPM2PNG(outputFile, tools.cbImageAsBase64);
					}
	
					if (query && query.vm) {
						getVMScreenshot(query.vm);
					}
					else {
						getVMScreenshot();
					}
				} catch (error) {
					response.statusCode = 500;
					response.end('Unexpected error.');
					console.error('Unexpected error.', error);
				}
				break;
	
			case '/filters':
				try {
					async function getNetworkFilters() {
						const { stdout,stderr } = await execFile('virsh', ['nwfilter-list']);
						console.log('[Info] Found network filters:\n', stdout);
						if (stderr !== '') {
							console.log('[Debug]', stderr);
						}
						tools.parseData(stdout, '  ', tools.cbPrintJSON);
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
						tools.parseData(stdout, '  ', tools.cbPrintJSON);
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
						tools.parseData(stdout, '  ', tools.cbPrintJSON);
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
						tools.parseData(stdout, '  ', tools.cbPrintJSON);
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
						tools.parseData(stdout, '  ', tools.cbPrintJSON);
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
						tools.parseData(stdout, '  ', tools.cbPrintJSON);
					}
	
					getVolumes('default');
				} catch (error) {
					response.statusCode = 500;
					response.end('Unexpected error.');
					console.error('Unexpected error.', error);
				}
				break;
		}
	}
	else {
		// log served response
		console.log('[Info] Serving static file:', URL);
		
		// Serve static files
		fs.readFile(filePath, function(error, content) {
			if (error) {
				console.error(error);
				if(error.code == 'ENOENT') {
					fs.readFile('./static-404.html', function(error, content) {
						if (error) {
							console.error(error);
						}
						else {
							response.writeHead(404, { 'Content-Type': 'text/html' });
							response.end(content, 'utf-8');
						}
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
	}
}).listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});