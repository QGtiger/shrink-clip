# shrink-clip

icon 生成工具: https://logofa.st/

An Electron application with React and TypeScript

## ffmpeg 压缩

* ffmpeg-status 二进制
  * 可能存在问题。   Error: FFmpeg binary not found
  * 解决方案： 去 下载 二进制文件 https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.0
    * 将其重命名为 `ffmpeg` 并放置在 `node_modules/ffmpeg-static` 目录中
    * 确保二进制文件有执行权限：
      ```bash
      chmod +x node_modules/ffmpeg-static/ffmpeg
      ```

* ffmpeg 配置项
  * crf	23	质量系数 (0=无损, 23=默认, 51=最差)
  * preset	medium	编码速度预设 (ultrafast, superfast, veryfast, faster, fast, medium, slow,     slower, veryslow)

1. `-crf 23`:
   - CRF（Constant Rate Factor）是x264和x265编码器中用来控制视频质量的参数。
   - 取值范围一般是0到51，其中0表示无损（文件会非常大），51表示质量最差。
   - 通常，我们使用18到28之间的值，18被认为是近似无损的（肉眼难以察觉），23是默认值，28则文件更小但质量更低。
   - 注意：不同的编码器可能有不同的CRF范围，但libx264和libx265都使用0-51。
2. `-preset medium`:
   - 预设（preset）用于控制编码速度和压缩效率之间的平衡。
   - 可用的预设从快到慢依次为：ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow。
   - 越慢的预设会提供更好的压缩率（即相同质量下文件更小），但编码时间更长。medium是一个不错的折中。
3. `-pix_fmt yuv420p`:
   - 设置像素格式。yuv420p是最广泛兼容的格式，大多数播放器和设备都支持。
   - 如果不设置，ffmpeg可能会根据编码器和输入选择像素格式，但有时会选择yuv444p或yuvj422p等，这些格式在某些播放器上可能无法正常播放。
   - 在Web环境中，通常要求yuv420p。
4. `-movflags faststart`:
   - 这个选项将moov atom（媒体元数据）从文件末尾移动到文件开头。
   - 这对于网络流媒体非常重要，因为这样播放器无需下载整个文件就可以开始播放（即支持流式播放）。
   - 通常用于MP4文件。
5. `-r ${options.fps}`:
   - 设置输出视频的帧率。如果提供了options.fps，则使用该值，否则不设置（使用输入帧率）。
   - 例如，`-r 30`表示将输出视频设置为30帧每秒。
6. `-vf scale=${options.width}:${options.height}`:
   - 这是一个视频过滤器（video filter），用于缩放视频。
   - 如果提供了options.width和options.height，则缩放视频到指定的宽度和高度。
   - 注意：这里直接指定了宽高，可能会改变视频的宽高比。如果需要保持宽高比，可以只设置宽度或高度，另一个设为-1（例如`scale=1280:-1`），ffmpeg会自动计算另一个维度以保持原始比例。
除了这些，还有一些常用的选项也可以考虑加入：
- `-profile:v baseline`：设置H.264的配置文件为baseline，以增加兼容性（特别是旧设备或移动设备）。
- `-level 3.0`：设置H.264的级别，与profile配合使用。
- `-tune`：根据视频内容进行调优，例如`-tune film`（电影）或`-tune animation`（动画）。
- `-b:v 1M`：设置目标视频比特率（例如1Mbps），与CRF二选一（CRF是质量模式，比特率是固定比特率模式）。
- `-maxrate`和`-bufsize`：用于可变比特率（VBR）控制，限制最大比特率和缓冲区大小。
- `-threads`：设置编码线程数，例如`-threads 0`表示自动选择（通常使用CPU核心数）。
另外，音频方面也可以添加一些选项：
- `-b:a 128k`：设置音频比特率，默认可能是64k或128k，根据需求调整。
- `-ar 44100`：设置音频采样率（Hz），常用44100或48000。
如果希望输出文件更小，可以适当提高CRF值（比如25或26），或者使用更慢的预设（如slow）。但要注意，更慢的预设会大大增加编码时间。
在移动设备兼容性方面，通常建议：
- 使用H.264编码（libx264）
- 像素格式yuv420p
- 使用baseline profile（或者main profile，high profile在较新的设备上支持良好）
- 设置合适的level（例如3.0或3.1）
所以，根据以上解释，我们可以扩展outputOptions以包含更多可选配置：
```javascript
.outputOptions([
  '-crf 23',
  '-preset medium',
  '-pix_fmt yuv420p',
  '-movflags faststart',
  // 帧率
  ...(options.fps ? [`-r ${options.fps}`] : []),
  // 缩放
  ...(options.width && options.height ? [`-vf scale=${options.width}:${options.height}`] : []),
  // 视频配置
  ...(options.profile ? [`-profile:v ${options.profile}`] : []),
  ...(options.level ? [`-level ${options.level}`] : []),
  ...(options.tune ? [`-tune ${options.tune}`] : []),
  // 音频比特率
  ...(options.audioBitrate ? [`-b:a ${options.audioBitrate}`] : []),
  // 线程数
  '-threads 0'
])
```
这样，我们可以通过options传递更多参数来控制输出。
