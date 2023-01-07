require('./check.js')
const { writeFileSync } = require('node:fs')
const http = require('node:http')
const { mid } = require('./target.json')
const list = require(`./${mid}.json`)

const n = list.length
let count = 0
list.forEach((el, i) => {
	setTimeout(() => {
		getLink(el, i)
	}, (i + 1) * 2000)
})

function getLink(el, i) {
	const { bvid, cid } = el
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
					list[i].audioLink = data.dash.audio[0].baseUrl
					console.log(`${bvid} audio url done`)
					count++
					if (count === n) {
						writeFileSync(`./${mid}.json`, JSON.stringify(list))
						console.log('get audio url done\n')
						console.log('start downloading audio(s) in 5s ...')
						setTimeout(() => {
							require('./download.js')
						}, 5000)
					}
				} else {
					console.error('get cid error', chunks)
					process.exit()
				}
			})
	})
}
