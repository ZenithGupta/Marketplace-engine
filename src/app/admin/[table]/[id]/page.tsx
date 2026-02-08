'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RecordData {
    [key: string]: any;
}

export default function RecordDetailPage({
    params
}: {
    params: { table: string; id: string }
}) {
    const { table, id } = params;
    const [record, setRecord] = useState<RecordData | null>(null);
    const [formData, setFormData] = useState<RecordData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const isNew = id === 'new';
    const isReadOnly = table === 'ownership_history';

    useEffect(() => {
        if (!isNew) {
            fetchRecord();
        } else {
            setIsLoading(false);
            setFormData(getDefaultFormData(table));
        }
    }, [table, id]);

    const fetchRecord = async () => {
        try {
            const res = await fetch(`/api/admin?table=${table}&id=${id}`);
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setRecord(data.record);
                setFormData(data.record);
            }
        } catch (error) {
            setError('Failed to fetch record');
        } finally {
            setIsLoading(false);
        }
    };

    const getDefaultFormData = (tableName: string): RecordData => {
        switch (tableName) {
            case 'profiles':
                // Profiles are linked to auth users - show notice
                return {
                    id: '', // UUID from auth.users - required
                    username: '',
                    avatar_url: '',
                    reputation_score: 0
                };
            case 'listings':
                return {
                    seller_id: '', // UUID of profile - required
                    title: '',
                    description: '',
                    base_price: 0,
                    status: 'DRAFT',
                    metadata: {}
                };
            case 'bids':
                return {
                    listing_id: '', // UUID of listing - required
                    bidder_id: '', // UUID of profile - required
                    amount: 0,
                    message_to_seller: '',
                    status: 'OPEN'
                };
            default:
                return {};
        }
    };

    const formatTableName = (name: string) => {
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
    };

    const formatFieldName = (name: string) => {
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
    };

    const handleChange = (key: string, value: any) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const url = '/api/admin';
            const method = isNew ? 'POST' : 'PATCH';
            const body = isNew
                ? { table, data: formData }
                : { table, id, data: formData };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                router.push(`/admin/${table}`);
            }
        } catch (error) {
            setError('Failed to save record');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            const res = await fetch(`/api/admin?table=${table}&id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push(`/admin/${table}`);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to delete');
            }
        } catch (error) {
            setError('Failed to delete record');
        }
    };

    const getInputType = (key: string, value: any) => {
        if (key.includes('price') || key.includes('amount') || key.includes('score')) return 'number';
        if (key.includes('url') || key.includes('avatar')) return 'url';
        if (key.includes('email')) return 'email';
        if (key.includes('_at')) return 'datetime-local';
        return 'text';
    };

    const isFieldEditable = (key: string) => {
        if (isReadOnly) return false;
        const readOnlyFields = ['id', 'created_at', 'updated_at'];
        return !readOnlyFields.includes(key);
    };

    const renderField = (key: string, value: any) => {
        const isEditable = isFieldEditable(key);
        const inputType = getInputType(key, value);

        if (key === 'status') {
            const options = table === 'listings'
                ? ['DRAFT', 'ACTIVE', 'NEGOTIATING', 'SOLD', 'ARCHIVED']
                : ['OPEN', 'ACCEPTED', 'REJECTED'];

            return (
                <select
                    value={formData[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    disabled={!isEditable}
                    className="field-input"
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        }

        if (key === 'metadata' || typeof value === 'object') {
            return (
                <textarea
                    value={typeof formData[key] === 'object' ? JSON.stringify(formData[key], null, 2) : formData[key] || ''}
                    onChange={(e) => {
                        try {
                            handleChange(key, JSON.parse(e.target.value));
                        } catch {
                            handleChange(key, e.target.value);
                        }
                    }}
                    disabled={!isEditable}
                    className="field-input field-textarea"
                    rows={4}
                />
            );
        }

        if (key.includes('description') || key.includes('message')) {
            return (
                <textarea
                    value={formData[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    disabled={!isEditable}
                    className="field-input field-textarea"
                    rows={4}
                />
            );
        }

        return (
            <input
                type={inputType}
                value={inputType === 'datetime-local'
                    ? (formData[key] ? new Date(formData[key]).toISOString().slice(0, 16) : '')
                    : (formData[key] ?? '')
                }
                onChange={(e) => handleChange(key, inputType === 'number' ? parseFloat(e.target.value) : e.target.value)}
                disabled={!isEditable}
                className="field-input"
            />
        );
    };

    if (isLoading) {
        return <div style={{ padding: 40, textAlign: 'center', color: '#8888a0' }}>Loading...</div>;
    }

    if (error && !record && !isNew) {
        return <div style={{ padding: 40, textAlign: 'center', color: '#ff6b6b' }}>Error: {error}</div>;
    }

    const fields = isNew ? Object.keys(formData) : Object.keys(record || {});

    return (
        <div className="record-detail">
            <style jsx>{`
        .record-detail { max-width: 800px; }
        .breadcrumb { margin-bottom: 16px; font-size: 13px; }
        .breadcrumb a { color: #4dabf7; text-decoration: none; }
        .breadcrumb span { color: #8888a0; margin: 0 8px; }
        .form-container { background: #1a1a2e; border-radius: 8px; border: 1px solid #2d2d44; }
        .form-header { padding: 16px 20px; border-bottom: 1px solid #2d2d44; }
        .form-title { font-size: 18px; font-weight: 500; color: #ffffff; margin: 0; }
        .form-body { padding: 20px; }
        .field-group { margin-bottom: 20px; }
        .field-label { display: block; font-size: 13px; font-weight: 500; color: #8888a0; margin-bottom: 6px; }
        .field-input { width: 100%; padding: 10px 12px; background: #0f0f1a; border: 1px solid #4a4a68; border-radius: 4px; color: #c0c0d0; font-size: 14px; }
        .field-input:focus { outline: none; border-color: #4dabf7; }
        .field-input:disabled { background: #16213e; color: #8888a0; }
        .field-textarea { resize: vertical; min-height: 80px; font-family: inherit; }
        .form-actions { display: flex; gap: 12px; padding: 16px 20px; border-top: 1px solid #2d2d44; background: #16213e; border-radius: 0 0 8px 8px; }
        .btn { padding: 10px 20px; border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; text-decoration: none; display: inline-block; }
        .btn-primary { background: #69db7c; color: #0f0f1a; }
        .btn-primary:hover { background: #b2f2bb; }
        .btn-primary:disabled { background: #4a4a68; color: #8888a0; cursor: not-allowed; }
        .btn-secondary { background: #4a4a68; color: #c0c0d0; }
        .btn-danger { background: rgba(255, 107, 107, 0.2); color: #ff6b6b; margin-left: auto; }
        .error-message { background: rgba(255, 107, 107, 0.1); border: 1px solid #ff6b6b; color: #ff6b6b; padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; }
        .readonly-notice { background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; color: #ffc107; padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; }
      `}</style>

            <div className="breadcrumb">
                <Link href="/admin">Home</Link>
                <span>›</span>
                <Link href={`/admin/${table}`}>{formatTableName(table)}</Link>
                <span>›</span>
                {isNew ? `Add ${formatTableName(table).toLowerCase()}` : `Edit ${id.substring(0, 8)}...`}
            </div>

            <div className="form-container">
                <div className="form-header">
                    <h1 className="form-title">
                        {isNew ? `Add ${formatTableName(table).toLowerCase()}` : `Change ${formatTableName(table).toLowerCase()}`}
                    </h1>
                </div>

                <div className="form-body">
                    {error && <div className="error-message">{error}</div>}
                    {isReadOnly && <div className="readonly-notice">This table is read-only.</div>}

                    {isNew && table === 'profiles' && (
                        <div className="readonly-notice">
                            ⚠️ Profiles are linked to authenticated users. The ID must be a valid UUID from auth.users.
                        </div>
                    )}

                    {isNew && table === 'listings' && (
                        <div style={{ background: 'rgba(77, 171, 247, 0.1)', border: '1px solid #4dabf7', color: '#4dabf7', padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
                            💡 Seller ID must be a valid profile UUID. Copy it from the Profiles table.
                        </div>
                    )}

                    {isNew && table === 'bids' && (
                        <div style={{ background: 'rgba(77, 171, 247, 0.1)', border: '1px solid #4dabf7', color: '#4dabf7', padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
                            💡 Listing ID and Bidder ID must be valid UUIDs from the Listings and Profiles tables respectively.
                        </div>
                    )}

                    {fields.map((key) => (
                        <div key={key} className="field-group">
                            <label className="field-label">
                                {formatFieldName(key)}
                                {(key === 'id' || key === 'seller_id' || key === 'bidder_id' || key === 'listing_id') && (
                                    <span style={{ color: '#ff6b6b', marginLeft: 4 }}>* UUID</span>
                                )}
                            </label>
                            {renderField(key, record?.[key])}
                        </div>
                    ))}
                </div>

                <div className="form-actions">
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || isReadOnly}>
                        {isSaving ? 'Saving...' : (isNew ? 'Add' : 'Save')}
                    </button>
                    <Link href={`/admin/${table}`} className="btn btn-secondary">Cancel</Link>
                    {!isNew && !isReadOnly && (
                        <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                    )}
                </div>
            </div>
        </div>
    );
}
