import GlitchText from '@renderer/components/GlitchText'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function ShrinkImage() {
  const nav = useNavigate()
  return (
    <div className="h-full w-full flex items-center justify-center flex-col gap-6">
      <div className=" w-full ">
        <GlitchText className=" mx-auto w-[360px]">敬请期待</GlitchText>
      </div>
      <Button type="primary" onClick={() => nav(-1)}>
        返回
      </Button>
    </div>
  )
}
