import PageWrapper from '@/components/layout/PageWrapper'

export default function LunchShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <PageWrapper>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <div className="relative game-column pb-4 pt-6">
        <div className="px-1">
          <h1 className="title-gold font-bytebounce text-[30px] leading-none sm:text-[34px]">
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-1.5 font-bytebounce text-[22px] leading-tight text-white"
              style={{ textShadow: '2px 2px 0 #3e2723' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </PageWrapper>
  )
}
