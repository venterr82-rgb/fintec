// Run once with: npx ts-node scripts/setup-yoco-webhook.ts
// Registers our webhook endpoint with Yoco and prints the secret

async function main() {
  const response = await fetch('https://api.yoco.com/v1/webhooks/subscriptions/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.YOCO_API_KEY}`,
    },
    body: JSON.stringify({
      name: 'Fintec Group portal registration',
      notification_url: 'https://portal.fintecgroup.co.za/api/webhooks/yoco',
      event_types: ['payment.created'],
    }),
  })

  const data = await response.json()
  console.log('Full response:', JSON.stringify(data, null, 2))
  console.log('\n✅ Copy this secret to your .env.local as YOCO_WEBHOOK_SECRET:')
  console.log(data.secret)
}

main().catch(console.error)
