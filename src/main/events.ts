import { BrowserWindow, dialog } from 'electron'
import { hanleEventByRenderer } from './utils'
import ffmpegPath from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'

// Set the path for ffmpeg
ffmpegPath && ffmpeg.setFfmpegPath(ffmpegPath)

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
      const exts = path.extname(input)

      const outputPath = path.join(
        path.dirname(input),
        `${path.basename(input, path.extname(input))}-small${exts}`
      )

      const command = ffmpeg(input).output(outputPath)

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

      command
        .outputOptions(outputOptions)
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`, progress)
        })
        .on('end', () => {
          console.log('Video processing finished successfully')
          resolve({ output: outputPath })
        })
        .on('error', (err) => {
          console.error('Error processing video:', err)
          reject({ error: err.message })
        })

      command.run()
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
