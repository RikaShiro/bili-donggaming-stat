const https = require('node:https')
const URL = require('node:url')
const { writeFileSync } = require('node:fs')
const qrcode = require('qrcode-terminal')

const print = (e) => {
	console.error(e)
}
console.log('please scan the qrcode below in bilibili App')
let qrcode_key
https
	.get(
		{
			hostname: 'passport.bilibili.com',
			path: '/x/passport-login/web/qrcode/generate',
			port: 443
		},
		// assume chunk size is small
		(res) => {
			res.on('data', (chunk) => {
				const { data } = JSON.parse(chunk)
				qrcode_key = data.qrcode_key
				qrcode.generate(data.url, { small: true })
			})
			res.on('error', print)
		}
	)
	.on('error', print)
	.end()

const checkLoginStatus = setInterval(() => {
	https
		.get(
			{
				hostname: 'passport.bilibili.com',
				path: `/x/passport-login/web/qrcode/poll?qrcode_key=${qrcode_key}`,
				port: 443
			},
			(res) => {
				res.on('data', (chunk) => {
					const { code, data } = JSON.parse(chunk)
					if (code !== 0) return
					switch (data.code) {
						case 0:
							write2file(data.url)
							break
						case 86038:
							console.log('qrcode expired')
							break
						case 86090:
							console.log('qrcode scanned but not confirmed')
							break
						case 86101:
							console.log('qrcode not scanned')
							break
						default:
							console.log('unexpected status code', data)
					}
				})
				res.on('error', print)
			}
		)
		.on('error', print)
		.end()
}, 8000)

function write2file(url) {
	clearInterval(checkLoginStatus)
	url = URL.parse(url)
	let params = new URLSearchParams(url.query)
	params = Array.from(params.entries())
	const token = {}
	for (const entry of params) {
		token[entry[0]] = entry[1]
	}
	delete token['gourl']
	writeFileSync('./token.json', JSON.stringify(token))
	console.log('done')
}
