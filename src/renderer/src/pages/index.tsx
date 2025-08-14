import RotatingText from '@renderer/components/RotatingText'
import ShinyText from '@renderer/components/ShinyText'
import { useWindowSize } from '@renderer/hooks/useWindowSize'
import { sendToMainByIPC } from '@renderer/utils'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const nav = useNavigate()
  useWindowSize(800, 560)

  return (
    <div className="h-full w-full flex justify-center items-center">
      <div className="flex flex-col gap-8">
        <div className="flex font-bold text-4xl font-mono items-center gap-2">
          Shrink
          <RotatingText
            texts={['Video', 'Image']}
            mainClassName="  px-2 sm:px-2 md:px-3 bg-[#4c29f5] overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
            staggerFrom={'last'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-120%' }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </div>
        <div className="flex gap-4 flex-col">
          <Button
            onClick={() => {
              nav('/shrinkvideo')
            }}
            size="large"
            className="app-drag-none text-gray-200"
            type="primary"
          >
            <ShinyText text="视频 压缩" />
          </Button>
          <Button
            onClick={() => {
              nav('/shrinkimage')
            }}
            size="large"
            className="app-drag-none text-gray-200"
            type="primary"
          >
            <ShinyText text="图片 压缩" />
          </Button>
        </div>
      </div>
    </div>
  )

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
