const SSEService =
  <ResolveUrlParams>(resolveUrl: (params: ResolveUrlParams) => string) =>
    ({
      onUpdate,
      onOpen,
      onClose,
      onError,
    }: {
      onUpdate: (data: unknown) => void
      onOpen?: () => void
      onClose?: () => void
      onError?: (error: unknown) => void
    }) =>
      (params: ResolveUrlParams) => {
        try {
          const eventSource = new EventSource(resolveUrl(params))
          eventSource.onmessage = function (event) {
            onUpdate(JSON.parse(event.data))
          }

          eventSource.onopen = function (e) {
            onOpen?.()
          }

          eventSource.addEventListener('end', function (e) {
            onClose?.()
            eventSource.close()
          })

          eventSource.onerror = function (e) {
            onError?.(e)
            if (this.readyState == EventSource.CONNECTING) {
              console.log(`Переподключение (readyState=${this.readyState})...`)
            } else {
              console.log('Произошла ошибка.')
            }
          }

          return () => eventSource.close()
        } catch (error) {
          onError?.(error)
        }
      }

const generate = SSEService<{ title: string; count: number; lang: string }>(
  ({ title, count, lang }) =>
    `/api/generate?title=${title}&count=${count}&lang=${lang}`,
)

    
export default generate
