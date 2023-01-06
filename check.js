const { existsSync, unlinkSync } = require('node:fs')

function check() {
	if (!existsSync('./headers.json')) {
		console.log('no headers')
		process.exit()
	}
	const headers = require('./headers.json')
	const now = Math.floor(Date.now() / 1000)
	if (now >= headers.Cookie.Expires) {
		console.log('cookie expired')
		unlinkSync('./headers.json')
		process.exit()
	}
	if (!existsSync('./target.json')) {
		console.log('no target')
		process.exit()
	}
}

module.exports = { check }
