const { existsSync, writeFileSync } = require('node:fs')
if (!existsSync('./token.json')) {
  console.log('no token')
  process.exit()
}

//add fake referer and user-agent
const https = require('node:https')
const { URLSearchParams } = require('node:url')
const token = require('./token.json')

const print = (e) => {
  console.error(e)
}
const options = {
	mid: 1074636993,
	order: 'pubdate',
	tid: 0,
	pn: 1,
	ps: 20
}
const params = new URLSearchParams(options)
https
	.get(
		{
			hostname: 'api.bilibili.com',
			path: `/x/space/arc/search?${params.toString()}`,
			port: 443,
			headers: {
				Cookie: token
			}
		},
		(res) => {
			res.on('data', (chunk) => {
				const { code, data } = JSON.parse(chunk)
				switch (code) {
					case 0:
						console.log(data)
						try {
							writeFileSync('./videos.json', JSON.stringify(data))
						} catch (e) {
							console.error(e)
						}
						break
					case -400:
						console.error('request error')
            break
          case -401:
            console.error('unauthorized access')
					case -412:
						console.error('request intercepted')
						break
					case -1200:
						console.log('request downgraded')
						break
					default:
						console.error(`unexpected status code ${code}`, JSON.parse(chunk))
				}
			})
      res.on('error', print)
		}
	)
	.on('error', print)
	.end()
