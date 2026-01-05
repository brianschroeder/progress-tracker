import { NextResponse } from 'next/server';
import { getUserSettings, updateUserSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = getUserSettings();
    const menuOrder = settings?.menuOrder ? JSON.parse(settings.menuOrder) : null;
    return NextResponse.json({ menuOrder });
  } catch (error) {
    console.error('Error fetching menu order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu order' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { menuOrder } = await request.json();

    if (!Array.isArray(menuOrder)) {
      return NextResponse.json(
        { error: 'menuOrder must be an array' },
        { status: 400 }
      );
    }

    const success = updateUserSettings({
      menuOrder: JSON.stringify(menuOrder),
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update menu order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, menuOrder });
  } catch (error) {
    console.error('Error updating menu order:', error);
    return NextResponse.json(
      { error: 'Failed to update menu order' },
      { status: 500 }
    );
  }
}
