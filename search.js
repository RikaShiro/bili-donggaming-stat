const { existsSync, writeFileSync, unlink } = require('node:fs')
if (!existsSync('./token.json')) {
	console.log('no token')
	process.exit()
}

const token = require('./token.json')
const now = Math.floor(Date.now() / 1000)
if (now >= token.Expires) {
	console.log('token expired')
	unlink('./token.json', print)
	process.exit()
}

const https = require('node:https')
const http = require('node:http')
const { URLSearchParams } = require('node:url')
const { mid } = require('./target.json')

const print = (info, data) => {
	console.error(info, data)
	process.exit()
}
const options = {
	mid,
	order: 'pubdate',
	tid: 0,
	pn: 1,
	ps: 10
}
const fakeUserAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54'
let bvidList = []

const search = () => {
	console.log(`search for videos ... page #${options.pn}`)
	const params = new URLSearchParams(options).toString()
	https.get(
		{
			hostname: 'api.bilibili.com',
			path: `/x/space/arc/search?${params}`,
			port: 443,
			// fake referer and user-agent are necessary
			headers: {
				Cookie: token,
				'User-Agent': fakeUserAgent,
				Referer: 'https://space1.bilibili.com/'
			}
		},
		// chunks size can be large. use chunks to collect
		(res) => {
			const chunks = []
			res.on('data', (chunk) => {
				chunks.push(chunk)
			})
			res.on('end', () => {
				parseChunks(chunks)
			})
		}
	)
}
const searchWithinRange = setInterval(search, 8000)

function parseChunks(chunks) {
	chunks = Buffer.concat(chunks)
	const { code, data } = JSON.parse(chunks)
	switch (code) {
		case 0:
			push2list(data)
			return
		case -400:
			print('request error', chunks)
			break
		case -401:
			print('unauthorized access', chunks)
			break
		case -412:
			print('request intercepted', chunks)
			break
		case -1200:
			print('request downgraded', chunks)
			break
		default:
			print(`unexpected status code ${code}`, chunks)
	}
	clearInterval(searchWithinRange)
}

function push2list(data) {
	let done = false
	const { list, page } = data
	const { vlist } = list
	vlist.forEach((video) => {
		const { created } = video
		if (within(created, 7)) {
			const { bvid, title } = video
			bvidList.push({ bvid, title })
		} else {
			done = true
		}
	})
	const { pn, ps, count } = page
	if (pn * ps >= count) {
		done = true
	}
	if (done) {
		clearInterval(searchWithinRange)
		console.log('search done')
		removeDuplication()
		cidAppend()
	} else {
		options.pn++
	}

	function within(timestamp, range = 365) {
		let diff = now - timestamp
		diff = Math.floor(diff / 86400)
		return diff < range
	}

	function removeDuplication() {
		bvidList = bvidList.map((x) => JSON.stringify(x))
		bvidList = new Set(bvidList)
		bvidList = Array.from(bvidList).map((x) => JSON.parse(x))
	}

	function cidAppend() {
		console.log('get cid from bvid ...')
		let count = 0
		const n = bvidList.length
		bvidList.forEach((el, i) => {
			const { bvid } = el
			setTimeout(() => {
				bvid2cid(bvid, i)
			}, (i + 1) * 1000)
		})

		function bvid2cid(bvid, i) {
			http.get(
				`http://api.bilibili.com/x/player/pagelist?bvid=${bvid}`,
				(res) => {
					res.on('data', (chunk) => {
						const { code, data } = JSON.parse(chunk)
						switch (code) {
							case 0:
								bvidList[i].cid = data[0].cid
								count++
								if (count === n) {
									write2file()
								}
								break
							case -400:
								print('request error', chunk)
								break
							case -404:
								print('video not exist', chunk)
								break
							default:
								print(`unexpected status code ${code}`, chunk)
						}
					})
				}
			)
		}

		function write2file() {
			console.log('write list to file ...')
			writeFileSync(`./${mid}.json`, JSON.stringify(bvidList))
			console.log('done')
		}
	}
}
