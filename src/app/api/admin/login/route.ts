import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';
const SESSION_SECRET = process.env.SESSION_SECRET || 'marketplace-admin-secret';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Create a simple session token
            const sessionToken = Buffer.from(`${email}:${Date.now()}:${SESSION_SECRET}`).toString('base64');

            // Set cookie
            const cookieStore = await cookies();
            cookieStore.set('admin_session', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 24 hours
                path: '/',
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }
}
