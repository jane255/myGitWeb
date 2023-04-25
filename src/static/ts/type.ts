// 定义一个事件回调类型
type EventCallback = (event: MouseEvent) => void

// 定义一个 Ajax 回调类型
type ResponseCallback = (response?: string) => void

// 定义一个接口 form 类型
interface apiForm {
    [key: string]: any
}