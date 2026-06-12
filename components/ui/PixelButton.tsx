// components/ui/PixelButton.tsx
interface PixelButtonProps {
  children: React.ReactNode
  onClick?: () => void
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit'
}

const colors = {
  green: 'bg-green-500 hover:bg-green-400 border-green-800 text-white',
  blue: 'bg-blue-500 hover:bg-blue-400 border-blue-800 text-white',
  red: 'bg-red-500 hover:bg-red-400 border-red-800 text-white',
  yellow: 'bg-yellow-400 hover:bg-yellow-300 border-yellow-700 text-black',
  gray: 'bg-gray-500 hover:bg-gray-400 border-gray-800 text-white',
}

const sizes = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export default function PixelButton({
  children,
  onClick,
  color = 'green',
  size = 'md',
  disabled = false,
  fullWidth = false,
  type = 'button'
}: PixelButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        pixel-btn
        font-pixel
        ${colors[color]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        rounded-none
        border-b-4
        border-r-4
        active:border-b-2
        active:border-r-2
        active:translate-x-0.5
        active:translate-y-0.5
        transition-all
        duration-75
      `}
    >
      {children}
    </button>
  )
}