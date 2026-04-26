import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'lib/letters.json');
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update letters.json', error);
    return NextResponse.json({ error: 'Failed to update letters file' }, { status: 500 });
  }
}
