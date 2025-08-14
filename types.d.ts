type ChannelInvokeMap = {
  ping: void
  winSetSize: {
    width: number
    height: number
  }
  winClose: void
  selectVideoFile: void
  compressVideo: CompressVideoInterface
  compressVideoCancel: void
}

type ChannelHandlelMap = {
  ping: void
  winSetSize: void
  winClose: void
  selectVideoFile: string | undefined
  compressVideo: {
    output: string
  }
  compressVideoCancel: void
}

type ChannelName = keyof ChannelInvokeMap

type ChannelInvokeData<T extends ChannelName> = ChannelInvokeMap[T]

interface CompressVideoInterface {
  input: string
  preset:
    | 'ultrafast'
    | 'superfast'
    | 'veryfast'
    | 'faster'
    | 'fast'
    | 'medium'
    | 'slow'
    | 'slower'
    | 'veryslow'
  crf: number
  resolution: 'original' | '1080p' | '720p' | '480p' | '360p'
  fps?: 'original' | number
}
