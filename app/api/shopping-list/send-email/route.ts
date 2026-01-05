import { NextResponse } from 'next/server';
import { getAllShoppingItems } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const items = getAllShoppingItems();

    // Group items by category
    const grouped: { [key: string]: any[] } = {};
    items.forEach((item: any) => {
      const category = item.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // Build email content
    let emailContent = '<!DOCTYPE html><html><head><style>';
    emailContent += 'body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }';
    emailContent += 'h1 { color: #3B82F6; }';
    emailContent += 'h2 { color: #64748B; margin-top: 20px; }';
    emailContent += 'ul { list-style: none; padding: 0; }';
    emailContent += 'li { padding: 8px; margin: 4px 0; background: #F8FAFC; border-left: 3px solid #3B82F6; }';
    emailContent += '.checked { text-decoration: line-through; opacity: 0.6; }';
    emailContent += '.quantity { color: #64748B; font-size: 0.9em; }';
    emailContent += '</style></head><body>';
    emailContent += '<h1>🛒 Shopping List</h1>';

    // Add items by category
    Object.keys(grouped).sort().forEach(category => {
      emailContent += `<h2>${category}</h2><ul>`;
      grouped[category].forEach((item: any) => {
        const checkedClass = item.isChecked ? 'checked' : '';
        const quantity = item.quantity ? `<span class="quantity">(${item.quantity})</span>` : '';
        emailContent += `<li class="${checkedClass}">${item.isChecked ? '✓ ' : ''}${item.name} ${quantity}</li>`;
      });
      emailContent += '</ul>';
    });

    emailContent += '</body></html>';

    // In a production environment, you would use a service like SendGrid, AWS SES, or Nodemailer
    // For now, we'll create a mailto link that opens the user's email client
    const subject = 'Your Shopping List';
    const textContent = items.map((item: any) => 
      `${item.isChecked ? '✓' : '○'} ${item.name}${item.quantity ? ` (${item.quantity})` : ''}`
    ).join('\n');

    // Return mailto URL for client-side email opening
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textContent)}`;

    return NextResponse.json({ 
      success: true,
      mailtoUrl,
      message: 'Email client will open to send your shopping list'
    });

  } catch (error) {
    console.error('Error sending shopping list email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
