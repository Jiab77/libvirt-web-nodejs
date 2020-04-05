"use strict";

(function () {
	const ppmbin = require('ppm-bin');
	const fs = require('fs');

	module.exports.libVirt = {
		response: null,
		setServerResponse: function (response) {
			console.log('[Debug] Storing server response.', response);
			/* console.log('[Debug] I am groot!');
			console.table(this); */
			libVirt.response = response;
		},
		getServerResponse: function () {
			/* console.log('[Debug] I am groot!');
			console.table(this); */
			return libVirt.response;
		},
		cbImageAsBase64: function (err, data) {
			if (err) {
				console.error(err);
			}
			else {
				/* console.log('[Debug] I am grooooooot!');
				console.table(this); */
				this.libVirt.imageAsBase64(data, this.libVirt.cbPrintHTML);
			}
		}.bind(this),
		cbPrintHTML: function (err, data) {
			if (err) {
				console.error(err);
			}
			else {
				/* console.log('[Debug] I am grooooooot!');
				console.table(this); */
				this.libVirt.printHTML(data);
			}
		}.bind(this),
		cbPrintJSON: function (err, data) {
			if (err) {
				console.error(err);
			}
			else {
				/* console.log('[Debug] I am grooooooot!');
				console.table(this); */
				this.libVirt.printJSON(data);
			}
		}.bind(this),
		PPM2PNG: function (image, callback) {
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
		imageAsBase64: async function (image, callback) {
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
		parseData: async function (output, delim, callback) {
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
}).call(this);
// });