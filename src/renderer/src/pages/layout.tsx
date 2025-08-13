import { App, ConfigProvider, message } from 'antd'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { MessageRef } from '@renderer/utils/customMessage'
import { setLocation, setNavigator } from '@renderer/utils/navigation'

export default function Layout() {
  const outlet = useOutlet()
  const navigate = useNavigate()
  const pageRef = useRef<HTMLDivElement>(null)
  const [messageApi, messageContextHolder] = message.useMessage()
  const location = useLocation()

  useEffect(() => {
    setNavigator(navigate)
  }, [navigate])

  useEffect(() => {
    setLocation(location)
  }, [location])

  useEffect(() => {
    MessageRef.current = messageApi
  })

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2a38d1'
        }
      }}
    >
      <App className="h-full">
        <div
          className=" h-full app-drag   overflow-hidden bg-[#7e7d77]  p-4 text-white"
          ref={pageRef}
        >
          {outlet}
          <div className="holder">{messageContextHolder}</div>
        </div>
      </App>
    </ConfigProvider>
  )
}
