// TODO: Remove & use built-in Response provided by node.js once v16 support is dropped
export class Response {
  constructor(
    protected body:string,
    protected init: {
      headers: Record<string, string>
      status: number
    }) {}

  async json(): Promise<any> {
    let body = this.body
    return new Promise(resolve => {
      queueMicrotask(() => {
        queueMicrotask(() => {
          resolve(JSON.parse(body))
        })
      })
    })
  }
}
export async function finishMicrotask(count = 1):Promise<null> {
  if (count < 1) return null
  return new Promise(resolve => {
    queueMicrotask(() => {
      resolve(finishMicrotask(count - 1))
    })
  })
}

export interface ErrorPayload {
  error: string
}
export interface Loading {
  loading: boolean
  message: string
}
export interface Person {
  loading: false
  name: string
  personId: number
}
export interface SearchMessage {
  loading: false
  recipientId: number
  senderId: number
  text: string
}
