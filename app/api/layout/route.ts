import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      nodes: [],
      status: 'not_implemented'
    },
    { status: 501 }
  );
}
