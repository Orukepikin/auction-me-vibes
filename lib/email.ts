// Email notification utility
// Uses a simple email service or can be upgraded to SendGrid, Resend, etc.

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  // Check if email service is configured
  if (!process.env.EMAIL_SERVER_HOST) {
    console.log('Email service not configured. Skipping email:', { to, subject })
    return false
  }

  try {
    // If using Resend (recommended - free tier available)
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Auction Me Vibes <noreply@auctionmevibes.com>',
          to,
          subject,
          html,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('Resend email error:', error)
        return false
      }

      return true
    }

    // Fallback: Log email (for development)
    console.log('📧 Email would be sent:', { to, subject })
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// Email templates
export function outbidEmailTemplate(data: {
  userName: string
  vibeTitle: string
  newBidAmount: string
  vibeUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been outbid!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a12; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #12121e; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <span style="font-size: 48px;">🌀</span>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px;">You've been outbid!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hey ${data.userName},
              </p>
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Someone just placed a higher bid on the vibe you were winning:
              </p>
              
              <!-- Vibe Card -->
              <div style="background-color: #1a1a2e; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0 0 8px;">
                  ${data.vibeTitle}
                </p>
                <p style="color: #fbbf24; font-size: 24px; font-weight: bold; margin: 0;">
                  New bid: ${data.newBidAmount}
                </p>
              </div>
              
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Don't let this one slip away! Place a higher bid now to stay in the lead.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.vibeUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                      Bid Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #2a2a3e;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                You're receiving this because you placed a bid on Auction Me Vibes.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function winnerSelectedEmailTemplate(data: {
  userName: string
  vibeTitle: string
  winningAmount: string
  vibeUrl: string
  paymentDeadline: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You won the auction!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a12; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #12121e; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <span style="font-size: 48px;">🏆</span>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px;">Congratulations, you won!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hey ${data.userName},
              </p>
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Amazing news! The creator has selected you as the winner for:
              </p>
              
              <!-- Vibe Card -->
              <div style="background-color: #1a1a2e; border-radius: 12px; padding: 20px; margin: 20px 0; border: 2px solid #fbbf24;">
                <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0 0 8px;">
                  ${data.vibeTitle}
                </p>
                <p style="color: #fbbf24; font-size: 24px; font-weight: bold; margin: 0;">
                  Winning bid: ${data.winningAmount}
                </p>
              </div>
              
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">
                Complete your payment to unlock the creator's contact information and claim your vibe!
              </p>
              <p style="color: #ef4444; font-size: 14px; margin: 0 0 30px;">
                ⏰ Payment deadline: ${data.paymentDeadline}
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.vibeUrl}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24, #f97316); color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                      Pay Now & Claim Vibe →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #2a2a3e;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                You're receiving this because you won an auction on Auction Me Vibes.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function paymentReceivedEmailTemplate(data: {
  userName: string
  vibeTitle: string
  amount: string
  netAmount: string
  winnerName: string
  winnerPhone?: string
  winnerEmail?: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment received!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a12; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #12121e; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <span style="font-size: 48px;">💰</span>
              <h1 style="margin: 16px 0 0; color: #ffffff; font-size: 24px;">Payment received!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hey ${data.userName},
              </p>
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Great news! Payment has been completed for your vibe:
              </p>
              
              <!-- Vibe Card -->
              <div style="background-color: #1a1a2e; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0 0 8px;">
                  ${data.vibeTitle}
                </p>
                <p style="color: #10b981; font-size: 24px; font-weight: bold; margin: 0;">
                  You earned: ${data.netAmount}
                </p>
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">
                  Total paid: ${data.amount}
                </p>
              </div>
              
              <!-- Winner Info -->
              <div style="background-color: #1a1a2e; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #10b981;">
                <p style="color: #10b981; font-size: 14px; font-weight: bold; margin: 0 0 12px;">
                  🔓 Winner Contact Info:
                </p>
                <p style="color: #ffffff; font-size: 16px; margin: 0 0 8px;">
                  <strong>Name:</strong> ${data.winnerName}
                </p>
                ${data.winnerPhone ? `<p style="color: #ffffff; font-size: 16px; margin: 0 0 8px;"><strong>Phone:</strong> ${data.winnerPhone}</p>` : ''}
                ${data.winnerEmail ? `<p style="color: #ffffff; font-size: 16px; margin: 0;"><strong>Email:</strong> ${data.winnerEmail}</p>` : ''}
              </div>
              
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Reach out to the winner and deliver your amazing vibe! 🎉
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #2a2a3e;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                You're receiving this because your vibe was sold on Auction Me Vibes.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
