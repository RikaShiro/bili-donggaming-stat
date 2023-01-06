require('./check.js')
const http = require('node:http')
const { URLSearchParams } = require('node:url')
const headers = require('./headers.json')

const oid = 303666249
const message = `testing, love from ${Date.now()}`
let params = {
	type: 1,
	oid,
	message,
	csrf: getCSRF(headers.Cookie)
}
params = new URLSearchParams(params)
params = params.toString()
headers['Content-Type'] = 'application/x-www-form-urlencoded'
headers['Content-Length'] = Buffer.byteLength(params)

const options = {
	hostname: 'api.bilibili.com',
	path: '/x/v2/reply/add',
	method: 'POST',
	headers
}

const req = http.request(options, (res) => {
	res.on('data', (chunk) => {
		chunk = JSON.parse(chunk)
		const { code } = chunk
		if (code === 0) {
			console.log('done')
		} else {
			console.error('post comment error', chunk)
			process.exit()
		}
	})
})
req.write(params)
req.end()

function getCSRF(cookie) {
	for (const s of cookie) {
		if (s.includes('bili_jct')) {
			const i = s.indexOf('=')
			return s.substring(i + 1)
		}
	}
}
