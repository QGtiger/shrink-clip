import { useWindowSize } from '@renderer/hooks/useWindowSize'
import { sendToMainByIPC } from '@renderer/utils'
import { Button } from 'antd'

export default function Home() {
  useWindowSize(300, 500)

  return (
    <div className=" font-semibold">
      <Button
        className="app-drag-none"
        type="primary"
        onClick={() => {
          sendToMainByIPC('selectVideoFile').then(console.log)
        }}
      >
        获取文件
      </Button>
    </div>
  )
}
