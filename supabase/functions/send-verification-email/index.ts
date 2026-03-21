import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reservationId, email, verificationCode, basketTitle, merchantName } = await req.json()

    // Envoyer l'email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY manquante (secret Supabase Edge Functions).')
    }

    // noreply@bqali.com nécessite que bqali.com soit vérifié sur https://resend.com/domains (sinon 403).
    // Secret optionnel : RESEND_FROM = "BQALI <noreply@bqali.com>" une fois le domaine vérifié.
    // Sinon : adresse de test Resend (domaine déjà autorisé par Resend).
    const fromAddress =
      Deno.env.get('RESEND_FROM')?.trim() || 'BQALI <onboarding@resend.dev>'

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `Confirmez votre réservation - Code: ${verificationCode}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmation de réservation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2E7D32, #4CAF50); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .code-box { background: #2E7D32; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 3px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .btn { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌱 BQALI</h1>
                <h2>Confirmation de votre réservation</h2>
              </div>
              
              <div class="content">
                <p>Bonjour,</p>
                <p>Votre réservation a été créée avec succès ! Voici les détails :</p>
                
                <div class="info-box">
                  <h3>📦 Panier réservé</h3>
                  <p><strong>${basketTitle}</strong></p>
                  <p>Chez <strong>${merchantName}</strong></p>
                </div>
                
                <div class="code-box">
                  Code de vérification : ${verificationCode}
                </div>
                
                <p>Pour confirmer votre réservation, entrez ce code dans l'application BQALI.</p>
                
                <div class="info-box">
                  <h3>⏰ Important</h3>
                  <p>• Ce code expire dans <strong>10 minutes</strong></p>
                  <p>• Présentez le QR code au commerçant lors du retrait</p>
                  <p>• Paiement en espèces sur place</p>
                </div>
                
                <p>Merci d'utiliser BQALI pour réduire le gaspillage alimentaire ! 🌍</p>
              </div>
              
              <div class="footer">
                <p>BQALI - Lutter contre le gaspillage alimentaire</p>
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!emailResponse.ok) {
      let details = ''
      try {
        details = await emailResponse.text()
      } catch {
        details = ''
      }
      throw new Error(
        `Erreur Resend: ${emailResponse.status} ${emailResponse.statusText}${details ? ` - ${details}` : ''}`
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email envoyé avec succès' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Erreur:', errMsg)
    return new Response(
      JSON.stringify({ error: errMsg }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 