import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      text: '',
      meta: {},
      status: 'not_implemented'
    },
    { status: 501 }
  );
}
