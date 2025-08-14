export class InfiniteProgressBar {
  startTime: number = Date.now()
  interval: NodeJS.Timeout | null = null

  constructor(public updateDisplay: (progress: number) => void) {}

  start() {
    this.startTime = Date.now()
    this.interval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000 // 秒
      // 使用对数函数使进度增长越来越慢
      const progress = 100 * (1 - Math.exp(-elapsed / 10))

      this.updateDisplay(Math.min(99.99, progress))
    }, 100)
  }

  stop() {
    this.interval && clearInterval(this.interval)
  }

  finish() {
    this.stop()
    this.updateDisplay(100)
  }
}
