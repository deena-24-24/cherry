import { useCallback, useEffect, useRef, useState } from 'react'

import generate from '../../service/generate'

const useGenerate = () => {
  const [data, setData] = useState<Record<string, any>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const closeRef = useRef<() => void>(() => {})

  const invoke = useCallback(
    ({ title, count, lang }: { title: string; count: number; lang: string }) => {
      closeRef.current?.()
      setIsGenerating(true)
      closeRef.current = generate({ 
        onUpdate: setData,
        onClose: () => {
          setIsGenerating(false)
        },
        onError: () => {
          setIsGenerating(false)
        }
      })({ title, count, lang })
    },
    [setData],
  )

  useEffect(() => {
    return () => closeRef.current?.()
  }, [])

  return { data, invoke, isGenerating }
}

export default useGenerate
