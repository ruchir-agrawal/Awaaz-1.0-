// ==============================================================================
// Awaaz WhatsApp Dispatcher Service (WhatsApp Cloud API & Twilio Fallback)
// ==============================================================================

/**
 * Sends a WhatsApp message via WhatsApp Cloud API or Twilio WhatsApp.
 * @param {string} to - Recipient phone number in E.164 format (e.g. +919876543210)
 * @param {string} messageText - Plain text message content
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendWhatsAppMessage(to, messageText) {
    if (!to) {
        return { success: false, error: 'Recipient phone number is missing' };
    }

    const cleanPhone = to.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    // 1. Check WhatsApp Cloud API (Meta)
    const cloudToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_KEY;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (cloudToken && phoneId) {
        try {
            const recipientNumber = formattedPhone.replace('+', '');
            const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cloudToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: recipientNumber,
                    type: 'text',
                    text: { body: messageText },
                }),
            });

            const data = await res.json();
            if (res.ok) {
                console.log(`[WhatsApp Cloud] Sent message to ${formattedPhone}, ID:`, data.messages?.[0]?.id);
                return { success: true, messageId: data.messages?.[0]?.id };
            } else {
                console.error('[WhatsApp Cloud Error]', data);
            }
        } catch (err) {
            console.error('[WhatsApp Cloud Exception]', err);
        }
    }

    // 2. Fallback to Twilio WhatsApp if Twilio is configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (twilioSid && twilioAuth) {
        try {
            const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
            const params = new URLSearchParams();
            params.append('From', twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`);
            params.append('To', `whatsapp:${formattedPhone}`);
            params.append('Body', messageText);

            const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            const data = await res.json();
            if (res.ok) {
                console.log(`[Twilio WhatsApp] Sent message to ${formattedPhone}, SID:`, data.sid);
                return { success: true, messageId: data.sid };
            } else {
                console.error('[Twilio WhatsApp Error]', data);
            }
        } catch (err) {
            console.error('[Twilio WhatsApp Exception]', err);
        }
    }

    // 3. Fallback for testing/dev: Log formatted message
    console.log(`[WhatsApp Simulated Dispatch]
To: ${formattedPhone}
Content:
${messageText}
----------------------------------------`);
    return { success: true, simulated: true };
}

/**
 * Sends an appointment booking confirmation to patient and notification to clinic owner.
 */
export async function sendBookingNotifications({
    businessName,
    patientName,
    patientPhone,
    ownerPhone,
    appointmentDatetime,
    serviceReason,
}) {
    const formattedDate = appointmentDatetime || 'Upcoming slot';

    // 1. Message for Patient
    const patientMsg = `🙏 *Namaste ${patientName || 'Customer'} ji!*

Aapka appointment *${businessName || 'our clinic'}* ke sath confirm ho gaya hai:

📅 *Date & Time:* ${formattedDate}
🩺 *Service:* ${serviceReason || 'General Consultation'}

📍 *Clinic:* ${businessName || 'Awaaz Partner Clinic'}
Agar aapko reschedule ya cancel karna ho, toh kripya is message ka reply karein.

Dhanyawaad! ✨`;

    // 2. Message for Clinic Owner
    const ownerMsg = `🔔 *New AI Appointment Booked!*

👤 *Patient:* ${patientName || 'Walk-in'}
📞 *Phone:* ${patientPhone || 'N/A'}
📅 *Time:* ${formattedDate}
🩺 *Reason:* ${serviceReason || 'General'}

_Logged automatically by Awaaz AI Receptionist._`;

    const patientResult = patientPhone ? await sendWhatsAppMessage(patientPhone, patientMsg) : null;
    const ownerResult = ownerPhone ? await sendWhatsAppMessage(ownerPhone, ownerMsg) : null;

    return { patientResult, ownerResult };
}
