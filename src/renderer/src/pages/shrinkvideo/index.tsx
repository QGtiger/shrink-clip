import { CloseOutlined } from '@ant-design/icons'
import DecryptedText from '@renderer/components/DecryptedText'
import { sendToMainByIPC } from '@renderer/utils'
import { createMessage } from '@renderer/utils/customMessage'
import { createModal } from '@renderer/utils/customModal'
import { InfiniteProgressBar } from '@renderer/utils/infiniteProgress'
import { useRequest } from 'ahooks'
import {
  Button,
  ConfigProvider,
  Form,
  Input,
  InputProps,
  Progress,
  Select,
  Slider,
  Typography
} from 'antd'
import { FolderClosed, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SelectFile({
  value,
  onChange,
  ...restProps
}: { value?: string; onChange?: (value?: string) => void } & InputProps) {
  return (
    <div className="flex gap-4 w-full items-center">
      <Input
        variant="underlined"
        className=" px-0 pointer-events-none"
        value={value}
        placeholder="请选择"
        {...restProps}
      />
      <Button
        className="!px-4"
        icon={<FolderClosed className="mt-1 px-0.5" />}
        onClick={() => {
          sendToMainByIPC('selectVideoFile').then((f) => {
            onChange?.(f)
          })
        }}
      ></Button>
    </div>
  )
}

const intialValues: CompressVideoInterface = {
  input: '',
  preset: 'medium',
  crf: 23,
  resolution: 'original',
  fps: 'original'
}

function CompressionProgress({
  onClose,
  name,
  compressionConfig
}: {
  name: string
  onClose?: () => void
  compressionConfig: CompressVideoInterface
}) {
  const [percent, setPercent] = useState(0)
  const infiniteProgressBarRef = useRef<InfiniteProgressBar | null>(null)

  useEffect(() => {
    sendToMainByIPC('compressVideo', compressionConfig).then((r) => {
      if (r.error) {
        console.error('Compression error:', r.error)
        createMessage({
          type: 'error',
          content: `压缩失败: ${r.error}`,
          duration: 5
        })
      } else {
        setPercent(100)

        createMessage({
          type: 'success',
          content: (
            <span>
              视频压缩完成(<Typography.Link>{r.output}</Typography.Link>)
            </span>
          ),
          duration: 3
        })
        onClose?.()
      }
    })
    window.electron.ipcRenderer.on('compressVideoProgress', (event, data) => {
      setPercent(+Math.round(data.percent || 0).toFixed(2))
    })

    window.electron.ipcRenderer.on('infiniteProgress', () => {
      const infiniteProgressBar = (infiniteProgressBarRef.current = new InfiniteProgressBar(
        (progress) => {
          setPercent(+progress.toFixed(2))
        }
      ))
      infiniteProgressBar.start()
    })

    return () => {
      window.electron.ipcRenderer.removeAllListeners('compressVideoProgress')
      window.electron.ipcRenderer.removeAllListeners('infiniteProgress')

      infiniteProgressBarRef.current?.stop()
    }
  }, [])

  return (
    <div className="flex gap-4 flex-col p-2 -mr-4">
      <div className="flex gap-4 items-center">
        <div className=" p-2 flex items-center justify-center w-11 h-11 bg-[#4d88f6] rounded-xl">
          <Video className=" text-white" />
        </div>
        <div className="flex flex-col w-1 flex-1">
          <div className=" font-semibold text-lg">正在压缩视频</div>
          <div>{name}</div>
        </div>
        <CloseOutlined
          onClick={onClose}
          className="p-2 hover:bg-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="text-sm text-gray-500">压缩进度</div>
          <div className="text-sm text-gray-500">{percent}%</div>
        </div>

        <Progress percent={percent} type="line" showInfo={false} />
      </div>

      <div className="flex justify-center flex-col items-center text-center text-gray-500">
        <div className=" text-gray-500">请稍后，正在处理您的视频文件</div>
        <div className="text-xs">预计还需好多好多时间</div>
      </div>
    </div>
  )
}

export default function ShrinkVideo() {
  const nav = useNavigate()
  const [form] = Form.useForm()

  const crfValue = Form.useWatch('crf', form)

  const { loading, run: onSubmit } = useRequest(
    async () => {
      const values = await form.validateFields()

      const modalIns = createModal({
        icon: null,
        content: (
          <CompressionProgress
            onClose={() => {
              sendToMainByIPC('compressVideoCancel')
              modalIns.destroy()
            }}
            compressionConfig={values}
            name={values.input ? values.input.split('/').pop() || '视频文件' : '视频文件'}
          />
        ),
        footer: null,
        centered: true,
        bodyStyle: {
          padding: 0
        }
      })
    },
    {
      manual: true
    }
  )

  return (
    <div className="flex flex-col h-full w-full p-2 gap-4 ">
      <div className="h-1 flex-1 app-drag-none">
        <ConfigProvider
          theme={{
            components: {
              Form: {
                labelColor: '#ffffff'
              },
              Input: {
                colorBgContainer: 'transparent', // 设置输入框背景透明
                hoverBorderColor: '#4096ff', // 可选：悬停状态边框
                colorText: '#ffffff'
              },
              Select: {
                colorBgContainer: 'transparent', // 设置输入框背景透明
                hoverBorderColor: '#4096ff', // 可选：悬停状态边框
                colorBgElevated: 'rgba(50, 50, 50, 1)',
                colorText: '#ffffff',
                colorTextQuaternary: '#aaa',
                colorIcon: '#fff',
                colorIconHover: '#fff',
                colorFillSecondary: 'rgba(255,255,255,0.1)',
                controlItemBgActive: 'rgba(255,255,255,0.2)',
                controlItemBgHover: 'rgba(255,255,255,0.1)',
                // colorBorder: 'rgba(255,255,255,0.2)',
                colorPrimaryHover: '#40a9ff'
              },
              Button: {
                colorBgContainer: 'transparent', // 设置按钮背景透明
                colorText: '#ffffff'
              }
            },
            token: {
              colorTextPlaceholder: '#ffffff'
            }
          }}
        >
          <div className="text-xl font-semibold app-drag mb-10">
            <DecryptedText
              text="Hi, Welcome to Video Compression"
              animateOn="view"
              revealDirection="center"
            />
          </div>
          <Form
            form={form}
            className=" app-drag-none w-full "
            layout="vertical"
            initialValues={intialValues}
          >
            <div className="flex w-full gap-6">
              <Form.Item
                className="w-2 flex-grow-[10]"
                name="input"
                label="选择视频文件"
                rules={[{ required: true, message: '请选择视频文件' }]}
              >
                <SelectFile placeholder="请选择视频文件" />
              </Form.Item>
            </div>

            <div className="flex w-full gap-6">
              <Form.Item
                className="w-2 flex-grow-[10]"
                name="preset"
                label={
                  <div className="flex gap-1 items-center">
                    预设值
                    <span className="text-xs">
                      (预设(preset)用于控制编码速度和压缩效率之间的平衡)
                    </span>
                  </div>
                }
              >
                <Select
                  variant="underlined"
                  className="w-full"
                  placeholder="请选择预设值"
                  options={[
                    { label: 'ultrafast', value: 'ultrafast' },
                    { label: 'superfast', value: 'superfast' },
                    { label: 'veryfast', value: 'veryfast' },
                    { label: 'faster', value: 'faster' },
                    { label: 'fast', value: 'fast' },
                    { label: 'medium', value: 'medium' },
                    { label: 'slow', value: 'slow' },
                    { label: 'slower', value: 'slower' },
                    { label: 'veryslow', value: 'veryslow' }
                  ]}
                  popupClassName="app-drag-none"
                />
              </Form.Item>

              <Form.Item
                className="w-2 flex-grow-[10]"
                name="resolution"
                label={<div className="flex gap-1 items-center">分辨率</div>}
              >
                <Select
                  variant="underlined"
                  className="w-full"
                  placeholder="请选择分辨率"
                  options={[
                    { label: '原始分辨率', value: 'original' },
                    { label: '1080p', value: '1080p' },
                    { label: '720p', value: '720p' },
                    { label: '480p', value: '480p' },
                    { label: '360p', value: '360p' }
                  ]}
                  popupClassName="app-drag-none"
                />
              </Form.Item>
            </div>

            <div className="flex w-full gap-6">
              <Form.Item
                className="w-2 flex-grow-[10]"
                name="crf"
                label={
                  <div className="flex gap-1 items-center">
                    CRF【<span className="font-mono">{crfValue || 0}</span>】
                    <span className="text-xs">(0-51，数值越大压缩越强)</span>
                  </div>
                }
              >
                <Slider
                  railStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)'
                  }}
                  className="mx-0"
                  min={1}
                  max={51}
                />
              </Form.Item>

              <Form.Item
                className="w-2 flex-grow-[10]"
                name="fps"
                label={<div className="flex gap-1 items-center">帧率</div>}
              >
                <Select
                  variant="underlined"
                  className="w-full"
                  placeholder="请选择帧率"
                  options={[
                    { label: '原始帧率', value: 'original' },
                    { label: '60fps', value: 60 },
                    { label: '30fps', value: 30 },
                    { label: '24fps', value: 24 }
                  ]}
                  popupClassName="app-drag-none"
                />
              </Form.Item>
            </div>
          </Form>
        </ConfigProvider>
      </div>
      <div className="flex justify-end flex-shrink-0 gap-4">
        <Button type="primary" loading={loading} onClick={onSubmit}>
          确认
        </Button>
        <Button
          className=" !bg-transparent text-gray-100 border-gray-400"
          onClick={() => {
            nav(-1)
          }}
        >
          取消
        </Button>
      </div>
    </div>
  )
}
