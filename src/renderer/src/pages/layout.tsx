import { App, ConfigProvider, message, Modal } from 'antd'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { MessageRef } from '@renderer/utils/customMessage'
import { setLocation, setNavigator } from '@renderer/utils/navigation'
import { ModalRef } from '@renderer/utils/customModal'

export default function Layout() {
  const outlet = useOutlet()
  const navigate = useNavigate()
  const pageRef = useRef<HTMLDivElement>(null)
  const [messageApi, messageContextHolder] = message.useMessage()
  const [modalApi, modalContextHolder] = Modal.useModal()
  const location = useLocation()

  useEffect(() => {
    setNavigator(navigate)
  }, [navigate])

  useEffect(() => {
    setLocation(location)
  }, [location])

  useEffect(() => {
    MessageRef.current = messageApi
    ModalRef.current = modalApi
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
          className="  h-full app-drag   overflow-hidden  p-4 text-white bg-black/50"
          ref={pageRef}
        >
          {outlet}
          <div className="holder app-drag-none">
            {messageContextHolder}
            {modalContextHolder}
          </div>
        </div>
      </App>
    </ConfigProvider>
  )
}
