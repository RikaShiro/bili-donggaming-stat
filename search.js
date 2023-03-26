require('./check.js')
const https = require('node:https')
const { URLSearchParams } = require('node:url')
const { writeFileSync } = require('node:fs')
const { mid } = require('./target.json')
const headers = require('./headers.json')

const now = Math.floor(Date.now() / 1000)
const options = {
	mid,
	order: 'pubdate',
	tid: 0,
	pn: 1,
	ps: 10
}
let bvidList = []

const search = () => {
	console.log(`search for videos ... page #${options.pn}`)
	const params = new URLSearchParams(options).toString()
	https.get(
		{
			hostname: 'api.bilibili.com',
			path: `/x/space/arc/search?${params}`,
			// fake referer and user-agent are necessary
			headers
		},
		// chunks size can be large. use chunks to collect
		(res) => {
			let chunks = []
			res.on('data', (chunk) => {
				chunks.push(chunk)
			})
			res.on('end', () => {
				chunks = Buffer.concat(chunks)
				chunks = JSON.parse(chunks)
				const { code, data } = chunks
				if (code === 0) {
					push2list(data)
				} else {
					console.error('search video error', chunks)
					process.exit()
				}
			})
		}
	)
}

const searchWithinRange = setInterval(search, 8000)

function push2list(data) {
	let done = false
	const { list, page } = data
	const { vlist } = list
	vlist.forEach((video) => {
		const { created } = video
		if (within(created, 30)) {
			const { aid, bvid, title } = video
			bvidList.push({ aid, bvid, title })
		} else {
			done = true
		}
	})
	if (!done) {
		const { pn, ps, count } = page
		if (pn * ps >= count) {
			done = true
		}
	}
	if (done) {
		clearInterval(searchWithinRange)
		console.log('search done')
		console.log(`got info of ${bvidList.length} videos`)
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
			}, (i + 1) * 2000)
		})

		function bvid2cid(bvid, i) {
			https.get(
				`https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`,
				(res) => {
					res.on('data', (chunk) => {
						chunk = JSON.parse(chunk)
						const { code, data } = chunk
						if (code === 0) {
							bvidList[i].cid = data[0].cid
							count++
							if (count === n) {
								writeFileSync(`./${mid}.json`, JSON.stringify(bvidList))
								console.log('get bvid done\n')
								console.log('start requesting audio url in 5s ...')
								setTimeout(() => {
									require('./getAudioLink.js')
								}, 5000)
							}
						} else {
							console.error(chunk)
							process.exit()
						}
					})
				}
			)
		}
	}
}
