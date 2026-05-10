import { Metadata } from 'next'
import { SharedPrdView } from './_components/shared-prd-view'

export const metadata: Metadata = {
  title: 'Shared PRD - Zedos',
  robots: { index: false, follow: false },
}

export default function SharedPrdPage({ params }: { params: { token: string } }) {
  return <SharedPrdView token={params.token} />
}
