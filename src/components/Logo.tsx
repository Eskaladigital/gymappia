import Image from 'next/image'

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 48, className = '' }: LogoProps) {
  return (
    <Image
      src="/icons/icon-512x512.png"
      alt="PACGYM"
      width={size}
      height={size}
      className={`rounded-xl ${className}`}
      priority
    />
  )
}
