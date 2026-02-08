import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');

    return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');

    return NextResponse.redirect(new URL('/admin/login', req.url));
}
