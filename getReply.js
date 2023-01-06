require('./check.js')
const http = require('node:http')
const { URLSearchParams } = require('node:url')
const headers = require('./headers.json')
const { writeFileSync } = require('node:fs')

const oid = 303666249
let params = {
	type: 1,
	oid
}
params = new URLSearchParams(params)
params = params.toString()

const options = {
	hostname: 'api.bilibili.com',
	path: `/x/v2/reply?${params}`,
	headers
}
http.get(options, (res) => {
	let chunks = []
	res.on('data', (chunk) => {
		chunks.push(chunk)
	})
	res.on('end', () => {
		chunks = Buffer.concat(chunks)
		chunks = JSON.parse(chunks)
		const { data } = chunks
		writeFileSync('./abc.json', JSON.stringify(data))
	})
})
