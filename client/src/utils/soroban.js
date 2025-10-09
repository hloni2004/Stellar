import { connect } from '@stellar/freighter-api'

export async function submitSignedXDRToRPC(signedXdr, rpcUrl) {
  // submit via fetch to the soroban rpc's /transactions endpoint
  const res = await fetch(`${rpcUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/soroban-rpc+json' },
    body: JSON.stringify({ 'tx': signedXdr })
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Soroban RPC submit failed: ${res.status} ${body}`)
  }
  return res.json()
}
