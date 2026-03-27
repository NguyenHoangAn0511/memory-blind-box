import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate we're sending an array of cards
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Path to the cards.json file targeting the lib folder root relative to process.cwd()
    const filePath = path.join(process.cwd(), 'lib/cards.json');
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update cards.json', error);
    return NextResponse.json({ error: 'Failed to update cards file' }, { status: 500 });
  }
}
