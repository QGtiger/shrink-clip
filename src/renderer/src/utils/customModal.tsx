import type { ModalFuncProps } from 'antd'
import type { HookAPI } from 'antd/es/modal/useModal'

/**
 * 简单的一个节流函数
 * @param fn 节流函数
 * @param delay 节流时间
 * @returns
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let lastTime = 0
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime > delay) {
      lastTime = now
      return fn.apply(this, args)
    }
  }
}

export const ModalRef = {
  current: undefined as unknown as HookAPI,
  modalInsList: [] as { destroy: () => void }[]
}

export function createModal(config: ModalFuncProps) {
  // 路由拦截，不让跳转
  const ins = ModalRef.current.confirm({
    ...config
  })
  ModalRef.modalInsList.push(ins)
  return ins
}
