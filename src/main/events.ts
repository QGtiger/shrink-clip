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

// Set the path for ffmpeg
ffmpegPath && ffmpeg.setFfmpegPath(ffmpegPath)

log.info('FFmpeg Path:', ffmpegPath)
log.info('FFmpeg Version:', ffmpegVersion)
log.info('FFmpeg URL:', ffmpegUrl)

let ffmpegCommandInstance: ffmpeg.FfmpegCommand | null = null

// 根据时间戳估算进度
function calculateProgressFromTimemark(timemark: string, totalDuration: number) {
  if (!timemark || !totalDuration) return 0

  const [hh, mm, ss] = timemark.split(':').map(parseFloat)
  const currentTime = hh * 3600 + mm * 60 + ss
  return Math.min(100, (currentTime / totalDuration) * 100)
}

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
    return new Promise(async (resolve, reject) => {
      const { input, preset, crf, resolution, fps } = event.data
      const { sender } = event
      const mainWindow = BrowserWindow.fromId(sender.id)

      if (!mainWindow) {
        reject({ error: 'Main window not found' })
        return
      }
      const exts = path.extname(input)

      const outputPath = path.join(
        path.dirname(input),
        `${path.basename(input, path.extname(input))}-small${exts}`
      )

      const totalDuration = await new Promise<number>((r) => {
        ffmpeg.ffprobe(event.data.input, (err, metadata) => {
          if (err) {
            r(0)
          } else {
            log.info('Video metadata:', metadata)
            const duration = metadata.format.duration || 0
            log.info('Video duration:', duration)
            r(duration)
          }
        })
      })

      // webm 格式不支持 无法获取到 duration 获取的事 ‘N/A’
      if (!totalDuration) {
        reject({ error: 'Failed to retrieve video duration' })
        return
      }

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

      const invalidDuration = typeof totalDuration !== 'number'

      if (invalidDuration) {
        // 如果无法获取到视频时长，使用无限进度条
        mainWindow.webContents.send('infiniteProgress')
      }

      command
        .outputOptions(outputOptions)
        .on('progress', (progress) => {
          if (invalidDuration) return
          // 使用 timemark 作为替代进度指标
          const percent =
            progress.percent !== undefined
              ? progress.percent
              : calculateProgressFromTimemark(progress.timemark, totalDuration)

          mainWindow.webContents.send('compressVideoProgress', {
            percent,
            time: progress.timemark
          })
        })
        .on('end', () => {
          console.log('Video processing finished successfully')
          resolve({ output: outputPath })
        })
        .on('error', (err) => {
          // console.error('Error processing video:', err)
          reject({ error: err.message })
        })

      command.run()

      // command.kill('SIGINT') // 终止命令
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
        // console.log('selectVideoFile', filePath)

        // const exts = path.extname(filePath)

        // const outputPath = path.join(
        //   path.dirname(filePath),
        //   `${path.basename(filePath, path.extname(filePath))}-small${exts}`
        // )

        // console.log('outputPath', path.dirname(filePath), outputPath)

        // // ffmpeg(filePath)
        // //   .outputOptions('-vf', 'scale=320:240')
        // //   .save(`${filePath}-small.mp4`)
        // //   .on('end', () => {
        // //     console.log('Video resized successfully')
        // //   })
        // //   .on('error', (err) => {
        // //     console.error('Error resizing video:', err)
        // //   })

        // console.log('ffmpegPath', ffmpegPath)

        // // 验证FFmpeg可用性
        // if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
        //   throw new Error('FFmpeg binary not found')
        // }

        // const command = ffmpeg(filePath)
        //   .output(outputPath)
        //   .outputOptions([
        //     '-crf 23', // 质量系数 (0-51)
        //     '-preset medium' // 编码速度/质量平衡
        //     // '-pix_fmt yuv420p', // 像素格式
        //     // '-movflags faststart' // 流媒体优化
        //   ])
        //   .on('progress', (progress) => {
        //     console.log(`Processing: ${progress.percent}% done`, progress)
        //   })
        //   .on('end', () => {
        //     console.log('Video processing finished successfully')
        //   })
        //   .on('error', (err) => {
        //     console.error('Error processing video:', err)
        //   })

        // command.run()

        return filePath
      })
  })
}
