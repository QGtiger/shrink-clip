import { BrowserWindow, dialog } from 'electron'
import { hanleEventByRenderer } from './utils'
import ffmpegPath from 'ffmpeg-static'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'

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

  hanleEventByRenderer('selectVideoFile', async (event) => {
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
        console.log('selectVideoFile', filePath)

        const exts = path.extname(filePath)

        const outputPath = path.join(
          path.dirname(filePath),
          `${path.basename(filePath, path.extname(filePath))}-small${exts}`
        )

        console.log('outputPath', path.dirname(filePath), outputPath)

        // ffmpeg(filePath)
        //   .outputOptions('-vf', 'scale=320:240')
        //   .save(`${filePath}-small.mp4`)
        //   .on('end', () => {
        //     console.log('Video resized successfully')
        //   })
        //   .on('error', (err) => {
        //     console.error('Error resizing video:', err)
        //   })

        console.log('ffmpegPath', ffmpegPath)

        // 验证FFmpeg可用性
        if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
          throw new Error('FFmpeg binary not found')
        }

        const command = ffmpeg(filePath)
          .output(outputPath)
          .outputOptions([
            '-crf 23', // 质量系数 (0-51)
            '-preset medium' // 编码速度/质量平衡
            // '-pix_fmt yuv420p', // 像素格式
            // '-movflags faststart' // 流媒体优化
          ])
          .on('progress', (progress) => {
            console.log(`Processing: ${progress.percent}% done`, progress)
          })
          .on('end', () => {
            console.log('Video processing finished successfully')
          })
          .on('error', (err) => {
            console.error('Error processing video:', err)
          })

        command.run()

        return filePath
      })
  })
}
