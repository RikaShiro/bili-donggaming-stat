const { existsSync, createWriteStream } = require('node:fs')
const { mid } = require('./target.json')
const listFile = `./${mid}.json`
if (!existsSync(listFile)) {
	console.error('bvid list does not exist')
	process.exit()
}

const print = (e, data) => {
	console.error(e, data)
	process.exit()
}
const http = require('node:http')
const https = require('node:https')
const list = require(listFile)
const token = require('./token.json')
const URL = require('node:url')
const fakeUserAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54'
list.forEach((el, i) => {
	setTimeout(() => {
		getLink(el, i)
	}, (i + 1) * 1000)
})

function getLink(el, i) {
	const { bvid, cid } = el
	const dst = `./videos/${bvid}.mp4`
	if (existsSync(dst)) return
	const options = {
		bvid,
		cid,
		fnval: 16
	}
	const params = new URLSearchParams(options).toString()
	let chunks = []
	http.get(`http://api.bilibili.com/x/player/playurl?${params}`, (res) => {
		res
			.on('data', (chunk) => {
				chunks.push(chunk)
			})
			.on('end', () => {
				chunks = Buffer.concat(chunks)
				chunks = JSON.parse(chunks)
				const { code, data } = chunks
				switch (code) {
					case 0:
						if (data) {
							const audioLink = data.dash.audio[0].baseUrl
							setTimeout(() => {
								downloadAudio(bvid, audioLink)
							}, (i + 1) * 1000)
						} else {
							print('invalid data', data)
						}
						break
					case -400:
						print('request error', chunks)
						break
					case -404:
						print('video not exist', chunks)
						break
					default:
						print(`unexpected status code ${code}`, chunks)
				}
			})
	})
}

function downloadAudio(bvid, src) {
	const dst = `./audios/${bvid}.m4a`
	if (existsSync(dst)) return
	const file = createWriteStream(dst)
	const { hostname, path } = URL.parse(src)
	const options = {
		hostname,
		path,
		port: 443,
		headers: {
			Cookie: token,
			'User-Agent': fakeUserAgent,
			Referer: 'https://www.bilibili.com/'
		}
	}
	https.get(options, (res) => {
		res.pipe(file)

		file.on('finish', () => {
			file.close()
			console.log(`${bvid} finished`)
		})
	})
}
