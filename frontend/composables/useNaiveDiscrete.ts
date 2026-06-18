import { useMessage, useDialog, useNotification } from 'naive-ui'

export function useNaiveDiscrete() {
  const message = useMessage()
  const dialog = useDialog()
  const notification = useNotification()
  return {
    message,
    dialog,
    notification,
  }
}
