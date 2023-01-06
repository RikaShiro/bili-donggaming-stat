require('./check.js')
const { existsSync, createWriteStream } = require('node:fs')
const { mid } = require('./target.json')
const listFile = `./${mid}.json`
if (!existsSync(listFile)) {
	console.error('bvid list does not exist')
	process.exit()
}
const http = require('node:http')
const https = require('node:https')
const URL = require('node:url')
const list = require(listFile)
const headers = require('./headers.json')

list.forEach((el, i) => {
	setTimeout(() => {
		getLink(el, i)
	}, (i + 1) * 2000)
})

function getLink(el, i) {
	const { bvid, cid } = el
	const dst = `./audios/${bvid}.m4a`
	if (existsSync(dst)) {
		console.log(`${dst} already exists`)
		return
	}
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
				if (code === 0) {
					const audioLink = data.dash.audio[0].baseUrl
					setTimeout(() => {
						downloadAudio(bvid, audioLink)
					}, (i + 1) * 2000)
				} else {
					console.error('get cid error', chunks)
					process.exit()
				}
			})
	})
}

function downloadAudio(bvid, src) {
	const dst = `./audios/${bvid}.m4a`
	const ws = createWriteStream(dst)
	const { hostname, path } = URL.parse(src)
	https.get(
		{
			hostname,
			path,
			headers
		},
		(res) => {
			res.pipe(ws)
			ws.on('finish', () => {
				ws.close()
				console.log(`${bvid} finished`)
			})
		}
	)
}
