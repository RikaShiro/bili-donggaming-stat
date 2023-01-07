const https = require('node:https')
const URL = require('node:url')
const { createWriteStream, existsSync, unlinkSync } = require('node:fs')
const headers = require('./headers.json')
const { mid } = require('./target.json')

let list = require(`./${mid}.json`)
list = list.map((el) => {
	const { bvid, audioLink } = el
	return { bvid, audioLink }
})
let n = list.length
let count = 0
let redo = false
filterList()

function filterList() {
	list = list.filter((el) => {
		const { bvid } = el
		const dst = `./audios/${bvid}.m4a`
		if (existsSync(dst)) {
			console.log(`${dst} already exists`)
			return false
		} else {
			return true
		}
	})
	n = list.length
	list.forEach((el, i) => {
		setTimeout(() => {
			const { bvid, audioLink } = el
			getAudio(bvid, audioLink)
		}, (i + 1) * 3000)
	})
}

function getAudio(bvid, src) {
	const dst = `./audios/${bvid}.m4a`
	const ws = createWriteStream(dst)
	const { hostname, path } = URL.parse(src)
	console.log(`start downloading ${dst}`)
	https
		.get(
			{
				hostname,
				path,
				headers
			},
			(res) => {
				res.pipe(ws)
				ws.on('finish', () => {
					ws.close()
					console.log(`download ${bvid} done`)
					count++
					if (count === n) {
						if (redo) {
							redoDownload()
						} else {
							console.log('download audio done')
						}
					}
				})
			}
		)
		.on('error', (e) => {
			count++
			redo = true
			unlinkSync(dst)
			console.log(`deleted file ${dst}`)
			console.log('download error')
			console.error(e)
			if (count === n) {
				redoDownload()
			}
		})

	function redoDownload() {
		console.log('redo download in 5s ...')
		count = 0
		redo = false
		setTimeout(() => {
			filterList()
		}, 5000)
	}
}
