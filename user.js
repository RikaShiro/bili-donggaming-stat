const { existsSync } = require('node:fs')
if (!existsSync('./token.json')) {
	return
}

const https = require('node:https')
const token = require('./token.json')

https
  .get(
    {
      hostname: 'api.bilibili.com',
      path: '/x/space/top/arc',
      port: 443,
      headers: {
        // Cookie: JSON.stringify(token)
      }
		},
		(res) => {
			res.on('data', (chunk) => {
        const { code, data } = JSON.parse(chunk)
        switch (code) {
          case 0:
            console.log(data)
            break
          case -400:
            console.error('request error')
            break
          case 53016:
            console.log('no top video')
            break
          default:
            console.error('unexpected status code', code)
        }
			})
			res.on('error', print)
		}
	)
	.on('error', print)
	.end()
