import { NextRequest, NextResponse } from 'next/server';
import { getWorkGoalById, updateWorkGoal, deleteWorkGoal } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const workGoal = getWorkGoalById(id);
    
    if (!workGoal) {
      return NextResponse.json(
        { error: 'Work goal not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workGoal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch work goal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const updated = updateWorkGoal({ ...body, id });
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Work goal not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ id, ...body });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update work goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const deleted = deleteWorkGoal(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Work goal not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete work goal' },
      { status: 500 }
    );
  }
}
