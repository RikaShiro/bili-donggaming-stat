const { existsSync } = require('node:fs')
const { mid } = require('./target.json')

const videoList = `./${mid}.json`
if (!existsSync(videoList)) {
	console.error('video list does not exist')
	process.exit()
}
// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const list = require(videoList)
list.forEach((video) => {
  download(video)
  video2audio(video)
})

function download(video) {
  const { bvid } = video
  const dst = `./videos/${bvid}.mp4`
  if (existsSync(dst)) return
  console.log(bvid)
}

function video2audio() {
  console.log(new Date())
}