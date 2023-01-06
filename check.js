const { existsSync, unlinkSync } = require('node:fs')

function check() {
	if (!existsSync('./headers.json')) {
		exit('no headers')
	}
	const headers = require('./headers.json')
	const now = Math.floor(Date.now() / 1000)
	if (now >= headers.Cookie.Expires) {
		unlinkSync('./headers.json')
		exit('cookie expired')
	}
	if (!existsSync('./target.json')) {
		exit('no target')
	}
	const target = require('./target.json')
	if (!target.mid) {
		unlinkSync('./target.json')
		exit('no target user id')
	}
	console.log('aaa')

	function exit(msg) {
		console.error(msg)
		process.exit()
	}
}

check()