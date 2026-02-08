'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TableInfo {
    name: string;
    count: number;
}

interface RecentAction {
    type: 'add' | 'change' | 'delete';
    table: string;
    id: string;
    title: string;
    time: string;
}

export default function AdminDashboard() {
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const res = await fetch('/api/admin');
            const data = await res.json();
            setTables(data.tables || []);
        } catch (error) {
            console.error('Failed to fetch tables:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTableName = (name: string) => {
        return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
    };

    const getNavGroup = (tableName: string) => {
        if (tableName === 'profiles') return 'USERS';
        if (tableName === 'ownership_history') return 'AUDIT';
        return 'MARKETPLACE';
    };

    const groupedTables = tables.reduce((acc, table) => {
        const group = getNavGroup(table.name);
        if (!acc[group]) acc[group] = [];
        acc[group].push(table);
        return acc;
    }, {} as Record<string, TableInfo[]>);

    return (
        <div className="dashboard">
            <style jsx>{`
        .dashboard {
          max-width: 1200px;
        }
        .dashboard-title {
          font-size: 24px;
          font-weight: 400;
          color: #ffffff;
          margin: 0 0 24px 0;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 32px;
        }
        .section-title {
          font-size: 11px;
          font-weight: 600;
          color: #4dabf7;
          padding: 8px 12px;
          letter-spacing: 0.5px;
          background: rgba(77, 171, 247, 0.1);
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .table-group {
          background: #1a1a2e;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #2d2d44;
        }
        .table-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-bottom: 1px solid #2d2d44;
        }
        .table-item:last-child {
          border-bottom: none;
        }
        .table-name {
          color: #4dabf7;
          font-size: 14px;
          text-decoration: none;
        }
        .table-name:hover {
          text-decoration: underline;
        }
        .table-actions {
          display: flex;
          gap: 16px;
        }
        .action-link {
          color: #69db7c;
          font-size: 12px;
          text-decoration: none;
        }
        .action-link:hover {
          text-decoration: underline;
        }
        .action-link.change {
          color: #4dabf7;
        }
        .recent-actions {
          background: #1a1a2e;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #2d2d44;
        }
        .recent-title {
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .no-actions {
          color: #8888a0;
          font-size: 13px;
          font-style: italic;
        }
        .loading {
          color: #8888a0;
          font-size: 14px;
        }
        .stats-row {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          flex: 1;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid #2d2d44;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-value {
          font-size: 32px;
          font-weight: 600;
          color: #e94560;
        }
        .stat-label {
          font-size: 12px;
          color: #8888a0;
          margin-top: 4px;
        }
      `}</style>

            <h1 className="dashboard-title">Site administration</h1>

            {isLoading ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    <div className="stats-row">
                        {tables.map((table) => (
                            <div key={table.name} className="stat-card">
                                <div className="stat-value">{table.count}</div>
                                <div className="stat-label">{formatTableName(table.name)}</div>
                            </div>
                        ))}
                    </div>

                    <div className="dashboard-grid">
                        <div className="tables-section">
                            {Object.entries(groupedTables).map(([group, groupTables]) => (
                                <div key={group} className="table-group">
                                    <div className="section-title">{group}</div>
                                    {groupTables.map((table) => (
                                        <div key={table.name} className="table-item">
                                            <Link href={`/admin/${table.name}`} className="table-name">
                                                {formatTableName(table.name)}
                                            </Link>
                                            <div className="table-actions">
                                                <Link href={`/admin/${table.name}/new`} className="action-link">+ Add</Link>
                                                <Link href={`/admin/${table.name}`} className="action-link change">✎ Change</Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="recent-actions">
                            <div className="recent-title">Recent actions</div>
                            <div className="no-actions">None available</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
