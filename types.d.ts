type ChannelInvokeMap = {
  ping: void
  winSetSize: {
    width: number
    height: number
  }
  winClose: void
  selectVideoFile: void
}

type ChannelHandlelMap = {
  ping: void
  winSetSize: void
  winClose: void
  selectVideoFile: string | undefined
}

type ChannelName = keyof ChannelInvokeMap

type ChannelInvokeData<T extends ChannelName> = ChannelInvokeMap[T]

type ChannelHandleData<T extends ChannelName> = Promise<ChannelHandlelMap[T]>
