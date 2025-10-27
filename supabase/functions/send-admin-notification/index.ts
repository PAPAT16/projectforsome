import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationRequest {
  changeType: string;
  title: string;
  description: string;
  severity: string;
  oldValue?: string;
  newValue?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: NotificationRequest = await req.json();

    const adminEmail = 'Mrc.morris@energefinancial.com';
    const emailSubject = `[CRITICAL] Food Truck Live: ${payload.title}`;
    const emailBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #f97316, #fb923c); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
            .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
            .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; margin-top: 5px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Critical System Change Alert</h1>
            </div>
            <div class="content">
              <div class="alert">
                <strong>Severity: ${payload.severity.toUpperCase()}</strong><br>
                A critical change has been detected in the Food Truck Live system.
              </div>
              
              <div class="info-box">
                <div class="label">Change Type:</div>
                <div class="value">${payload.changeType}</div>
              </div>
              
              <div class="info-box">
                <div class="label">Title:</div>
                <div class="value">${payload.title}</div>
              </div>
              
              <div class="info-box">
                <div class="label">Description:</div>
                <div class="value">${payload.description}</div>
              </div>
              
              ${payload.oldValue ? `
              <div class="info-box">
                <div class="label">Previous Value:</div>
                <div class="value">${payload.oldValue === 'REDACTED' ? '[REDACTED FOR SECURITY]' : payload.oldValue}</div>
              </div>
              ` : ''}
              
              ${payload.newValue ? `
              <div class="info-box">
                <div class="label">New Value:</div>
                <div class="value">${payload.newValue === 'REDACTED' ? '[REDACTED FOR SECURITY]' : payload.newValue}</div>
              </div>
              ` : ''}
              
              <div class="info-box">
                <div class="label">Timestamp:</div>
                <div class="value">${new Date().toLocaleString()}</div>
              </div>
              
              <div class="alert" style="background: #fef3c7; border-left-color: #f59e0b;">
                <strong>Action Required:</strong><br>
                Please review this change immediately. If you did not authorize this change, take action to secure your account.
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from Food Truck Live</p>
              <p>Do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`Would send email to: ${adminEmail}`);
    console.log(`Subject: ${emailSubject}`);
    console.log('Email notification logged (actual sending requires email service configuration)');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification logged successfully',
        details: {
          recipient: adminEmail,
          changeType: payload.changeType,
          severity: payload.severity,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});