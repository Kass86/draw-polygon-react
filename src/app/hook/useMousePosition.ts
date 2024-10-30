import { RefObject, useEffect, useState, useRef } from 'react'

interface IUseMousePosition {
  divRef: RefObject<HTMLDivElement>
  size: number[]
  scrollXOffset: number
  scrollYOffset: number
}

export const useMousePosition = ({
  divRef,
  size = [0, 0],
  scrollXOffset = 0,
  scrollYOffset = 0
}: IUseMousePosition) => {
  const [position, setPosition] = useState({ xCord: 0, yCord: 0 })
  const originRef = useRef<DOMRect | null>(null)

  useEffect(() => {
    function setFromEvent(e: { clientX: number; clientY: number }): void {
      if (!divRef?.current) return
      if (!originRef.current) {
        // Calculate and store the origin coordinates
        originRef.current = divRef.current.getBoundingClientRect()
      }
      const origin = originRef.current

      if (!size[0] && !size[1])
        setPosition({
          xCord: e.clientX - origin.x + scrollXOffset,
          yCord: e.clientY - origin.y + scrollYOffset
        })
      else {
        setPosition({
          xCord: e.clientX - size[0] + scrollXOffset,
          yCord: e.clientY - size[1] + scrollYOffset
        })
      }
    }

    if (divRef.current) {
      divRef.current.addEventListener('mousemove', setFromEvent)
    }

    return () => {
      if (divRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        divRef.current.removeEventListener('mousemove', setFromEvent)
      }
    }
  }, [divRef, size, scrollXOffset, scrollYOffset])

  return position
}

export default useMousePosition
