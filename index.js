const https = require('node:https')
const URL = require('node:url')
const { writeFileSync } = require('node:fs')
const qrcode = require('qrcode-terminal')

console.log('please scan the qrcode below in bilibili App')
let qrcode_key
https.get(
	'https://passport.bilibili.com/x/passport-login/web/qrcode/generate',
	// assume chunk size is small
	(res) => {
		res.on('data', (chunk) => {
			const { data } = JSON.parse(chunk)
			qrcode_key = data.qrcode_key
			qrcode.generate(data.url, { small: true })
		})
	}
)

// assume the previous https requesr will be resolved in 8 seconds
const checkLoginStatus = setInterval(() => {
	https.get(
		`https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${qrcode_key}`,
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
						console.log(`unexpected status code ${code}`, data)
				}
			})
		}
	)
}, 8000)

function write2file(url) {
	clearInterval(checkLoginStatus)
	url = URL.parse(url)
	let params = new URLSearchParams(url.query)
	params = Array.from(params.entries())
	const token = {}
	for (const [k, v] of params) {
		token[k] = v
	}
	token.csrf = token.bili_jct
	delete token['gourl']
	const headers = {
		Cookie: token,
		Referer: 'https://space1.bilibili.com/',
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54'
	}
	writeFileSync('./headers.json', JSON.stringify(headers))
	console.log('done')
}
