import { connect } from '@stellar/freighter-api'

export async function submitSignedXDRToRPC(signedXdr, rpcUrl) {
  // submit via fetch to the soroban rpc endpoint using the correct method
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: {
        transaction: signedXdr
      }
    })
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Soroban RPC submit failed: ${res.status} ${body}`)
  }
  
  const response = await res.json()
  
  // Check for JSON-RPC error
  if (response.error) {
    throw new Error(`Soroban RPC error: ${response.error.message || JSON.stringify(response.error)}`)
  }
  
  return response.result
}
