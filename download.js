const { existsSync } = require('node:fs')
const { mid } = require('./target.json')

const videoFile = `./${mid}.json`
if (!existsSync(videoFile)) {
	console.error('video list does not exist')
	process.exit()
}
// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const list = require(videoFile)
list.forEach((video) => {
  download(video)
  video2audio(video)
})