const { existsSync, writeFileSync, unlink } = require('node:fs')
if (!existsSync('./token.json')) {
	console.log('no token')
	process.exit()
}
const print = (e) => {
	console.error(e)
}
const token = require('./token.json')
const now = Math.floor(Date.now() / 1000)
if (now >= token.Expires) {
	console.log('token expired')
	unlink('./token.json', print)
	process.exit()
}

const https = require('node:https')
const { URLSearchParams } = require('node:url')
const { mid } = require('./target.json')

const options = {
	mid,
	order: 'pubdate',
	tid: 0,
	pn: 1,
	ps: 10
}
const fakeUserAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54'
let fullList = []

const search = () => {
	console.log(`searching for videos ... page #${options.pn}`)
	const params = new URLSearchParams(options)
	https
		.get(
			{
				hostname: 'api.bilibili.com',
				path: `/x/space/arc/search?${params.toString()}`,
				port: 443,
				// fake referer and user-agent are necessary
				headers: {
					Cookie: token,
					'User-Agent': fakeUserAgent,
					Referer: 'https://space1.bilibili.com/'
				}
			},
			// chunks size can be large, thus use chunks to collect
			(res) => {
				const chunks = []
				res.on('data', (chunk) => {
					chunks.push(chunk)
				})
				res.on('error', print)
				res.on('end', () => {
					parseChunks(chunks)
				})
			}
		)
		.on('error', print)
		.end()
}
const searchWithinRange = setInterval(search, 10000)

function parseChunks(chunks) {
	chunks = Buffer.concat(chunks)
	const { code, data } = JSON.parse(chunks)
	switch (code) {
		case 0:
			add2list(data)
			break
		case -400:
			exitWithMsg('request error')
			break
		case -401:
			exitWithMsg('unauthorized access')
			break
		case -412:
			exitWithMsg('request intercepted')
			break
		case -1200:
			exitWithMsg('request downgraded')
			break
		default:
			exitWithMsg(`unexpected status code ${code}`, chunks)
	}

	function exitWithMsg(msg) {
		console.error(msg)
		clearInterval(searchWithinRange)
	}
}

function add2list(data) {
	let done = false
	const { list, page } = data
	const { vlist } = list
	vlist.forEach((video) => {
		const { created } = video
		if (within(created, 30)) {
			const { bvid, title } = video
			fullList.push({ bvid, title })
		} else {
			done = true
		}
	})
	const { pn, ps, count } = page
	if (pn * ps >= count) {
		done = true
	}
	if (done) {
		write2file()
	} else {
		options.pn++
	}

	function within(timestamp, range = 365) {
		let diff = now - timestamp
		diff = Math.floor(diff / 86400)
		return diff < range
	}

	function write2file() {
		clearInterval(searchWithinRange)
		console.log('search done')
		console.log('writing list to file ...')
		fullList = fullList.map((x) => JSON.stringify(x))
		fullList = new Set(fullList)
		fullList = Array.from(fullList).map((x) => JSON.parse(x))
		writeFileSync(`./${mid}.json`, JSON.stringify(fullList))
		console.log('done')
	}
}
