import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin Supabase client with service role key (bypasses RLS)
// For now, we'll use the anon key but you should add SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple admin authentication check
function isAdminAuthenticated(req: NextRequest): boolean {
    const authHeader = req.headers.get('x-admin-token');
    return authHeader === process.env.SESSION_SECRET;
}

// Available tables for admin
const ADMIN_TABLES = ['profiles', 'listings', 'orders'];

// GET - Fetch records from a table
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const table = url.searchParams.get('table');
    const id = url.searchParams.get('id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // If no table specified, return table list with counts
    if (!table) {
        const tables = await Promise.all(
            ADMIN_TABLES.map(async (tableName) => {
                const { count } = await supabaseAdmin
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                return { name: tableName, count: count || 0 };
            })
        );
        return NextResponse.json({ tables });
    }

    // Validate table name
    if (!ADMIN_TABLES.includes(table)) {
        return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    // Fetch single record
    if (id) {
        const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json({ record: data });
    }

    // Fetch paginated list
    const { data, error, count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        records: data,
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        },
    });
}

// POST - Create new record
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { table, data } = body;

        if (!table || !ADMIN_TABLES.includes(table)) {
            return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
        }



        const { data: record, error } = await supabaseAdmin
            .from(table)
            .insert(data)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ record }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

// PATCH - Update record
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { table, id, data } = body;

        if (!table || !ADMIN_TABLES.includes(table)) {
            return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
        }

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }



        const { data: record, error } = await supabaseAdmin
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ record });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

// DELETE - Delete record
export async function DELETE(req: NextRequest) {
    const url = new URL(req.url);
    const table = url.searchParams.get('table');
    const id = url.searchParams.get('id');

    if (!table || !ADMIN_TABLES.includes(table)) {
        return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (table === 'profiles') {
        // Delete the user from auth.users (which will cascade to public.profiles)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
