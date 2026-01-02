import { NextRequest, NextResponse } from 'next/server';
import { deleteCompletion } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = deleteCompletion(Number(params.id));
    
    if (!success) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
