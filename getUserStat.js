require('./check.js')
const http = require('node:http')
const headers = require('./headers.json')

const options = {
	hostname: 'api.bilibili.com',
  path: `/x/web-interface/nav/stat?csrf${headers.Cookie.bili_jct}`,
	headers
}

http.get(options, (res) => {
	res.on('data', (chunk) => {
		console.log(chunk.toString())
	})
})
