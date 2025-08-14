import { BrowserWindow, dialog } from 'electron'
import { hanleEventByRenderer } from './utils'

import log from 'electron-log/main'

import {
  path as ffmpegPath,
  version as ffmpegVersion,
  url as ffmpegUrl
} from '@ffmpeg-installer/ffmpeg'

import ffmpeg from 'fluent-ffmpeg'
import path from 'path'

// 替换 asar 为 asar.unpacked 以获取解压目录
const unpackedFfmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')

// Set the path for ffmpeg
unpackedFfmpegPath && ffmpeg.setFfmpegPath(unpackedFfmpegPath)

log.info('FFmpeg Path:', ffmpegPath, unpackedFfmpegPath)
log.info('FFmpeg Version:', ffmpegVersion)
log.info('FFmpeg URL:', ffmpegUrl)

let ffmpegCommandInstance: ffmpeg.FfmpegCommand | null = null

export function initEvents() {
  hanleEventByRenderer('winSetSize', async (event) => {
    const { width, height } = event.data
    const { sender } = event
    const mainWindow = BrowserWindow.fromId(sender.id)
    if (mainWindow) {
      mainWindow.setSize(width, height)
      mainWindow.setResizable(false)
    }
  })

  hanleEventByRenderer('compressVideo', async (event) => {
    return new Promise((resolve, reject) => {
      const { input, preset, crf, resolution, fps } = event.data
      const { sender } = event
      const mainWindow = BrowserWindow.fromId(sender.id)

      if (!mainWindow) {
        throw new Error('Main window not found')
      }
      const exts = path.extname(input)

      const outputPath = path.join(
        path.dirname(input),
        `${path.basename(input, path.extname(input))}-small${exts}`
      )

      const command = (ffmpegCommandInstance = ffmpeg(input).output(outputPath))

      const outputOptions: string[] = [
        `-crf ${crf}`, // 质量系数 (0-51)
        `-preset ${preset}`, // 编码速度/质量平衡
        '-pix_fmt yuv420p', // 像素格式
        '-movflags +faststart' // 流媒体优化
      ]

      if (resolution !== 'original') {
        const resolutions = {
          '1080p': '1920:1080',
          '720p': '1280:720',
          '480p': '854:480',
          '360p': '640:360'
        }
        const scaleFilter = `scale=${resolutions[resolution]}:flags=lanczos`
        command.videoFilters(scaleFilter)
      }

      // 帧率配置
      if (fps !== 'original') {
        outputOptions.push(`-r ${fps}`)
      }

      console.log(outputOptions)

      let invalidDuration = false

      command
        .outputOptions(outputOptions)
        .on('progress', (progress) => {
          if (invalidDuration) return
          const { percent, timemark } = progress
          if (percent === undefined) {
            invalidDuration = true

            // 如果无法获取到视频时长，使用无限进度条
            mainWindow.webContents.send('infiniteProgress')
            return
          }

          mainWindow.webContents.send('compressVideoProgress', {
            percent,
            timemark
          })
        })
        .on('end', () => {
          console.log('Video processing finished successfully')
          resolve({ output: outputPath })
        })
        .on('error', (err) => {
          reject(err.message || 'Error processing video')
        })

      command.run()
    })
  })

  hanleEventByRenderer('compressVideoCancel', async () => {
    return new Promise((resolve) => {
      if (ffmpegCommandInstance) {
        ffmpegCommandInstance.kill('SIGINT') // 终止命令
        ffmpegCommandInstance = null
        resolve()
      } else {
        resolve()
      }
    })
  })

  hanleEventByRenderer('selectVideoFile', async () => {
    return dialog
      .showOpenDialog({
        properties: ['openFile'],
        filters: [
          {
            name: 'Videos',
            extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm']
          }
        ]
      })
      .then((result) => {
        if (result.canceled) {
          return
        }
        const filePath = result.filePaths[0]

        return filePath
      })
  })
}
