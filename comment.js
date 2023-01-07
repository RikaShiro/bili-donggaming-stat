require('./check.js')
const http = require('node:http')
const { URLSearchParams } = require('node:url')
const headers = require('./headers.json')

const TESTING = true
let oid, message
if (TESTING) {
	oid = require('./target.json').oid
	message = 'testing emoji [脱单_doge]'
} else {
	const { mid } = require('./target.json')
	const list = require(`./${mid}.json`)
	if (list.length === 0) {
		console.error('empty list', list)
		process.exit()
	} else {
		oid = list[0].aid
		message = '懂哥没你视频我都吃不下饭'
	}
}
 
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
	let chunks = []
	res.on('data', (chunk) => {
		chunks.push(chunk)
	})
	res.on('end', () => {
		chunks = Buffer.concat(chunks)
		chunks = JSON.parse(chunks)
		const { code } = chunks
		if (code === 0) {
			console.log(`post comment done. tesing = ${TESTING}`)
		} else {
			console.error('post comment error', chunks)
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
	console.error('CSRF does not exist', cookie)
	process.exit()
}
