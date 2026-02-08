'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
}

interface TableInfo {
  name: string;
  count: number;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

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
    <div className="admin-container">
      <style jsx global>{`
        .admin-container {
          min-height: 100vh;
          background-color: #0f0f1a;
          color: #c0c0d0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .admin-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #2d2d44;
        }
        .admin-logo {
          color: #e94560;
          font-size: 20px;
          font-weight: 600;
          text-decoration: none;
        }
        .admin-user {
          color: #8888a0;
          font-size: 13px;
        }
        .admin-user span {
          color: #f39c12;
        }
        .admin-main {
          display: flex;
          min-height: calc(100vh - 56px);
        }
        .admin-sidebar {
          width: 260px;
          background: #1a1a2e;
          border-right: 1px solid #2d2d44;
          padding: 16px 0;
          flex-shrink: 0;
        }
        .admin-nav-group {
          margin-bottom: 8px;
        }
        .admin-nav-title {
          font-size: 11px;
          font-weight: 600;
          color: #4dabf7;
          padding: 8px 20px;
          letter-spacing: 0.5px;
          background: rgba(77, 171, 247, 0.1);
          margin: 0 12px;
          border-radius: 4px;
        }
        .admin-nav-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          color: #c0c0d0;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.15s ease;
          margin: 2px 12px;
          border-radius: 4px;
        }
        .admin-nav-item:hover {
          background: #2d2d44;
          color: #ffffff;
        }
        .admin-nav-item.active {
          background: #e94560;
          color: #ffffff;
        }
        .admin-nav-count {
          background: #2d2d44;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          color: #8888a0;
        }
        .admin-nav-item.active .admin-nav-count {
          background: rgba(255,255,255,0.2);
          color: #ffffff;
        }
        .admin-content {
          flex: 1;
          padding: 24px;
          overflow-x: auto;
        }
        .admin-actions {
          display: flex;
          gap: 12px;
          margin-left: 12px;
          padding: 8px 0;
        }
        .admin-action-link {
          color: #69db7c;
          font-size: 12px;
          text-decoration: none;
          transition: color 0.15s;
        }
        .admin-action-link:hover {
          color: #b2f2bb;
          text-decoration: underline;
        }
        .admin-action-link.change {
          color: #4dabf7;
        }
        .admin-action-link.change:hover {
          color: #a5d8ff;
        }
      `}</style>

      <header className="admin-header">
        <Link href="/admin" className="admin-logo">
          Marketplace Admin
        </Link>
        <div className="admin-user">
          WELCOME, <span>ADMIN</span> | <Link href="/" style={{ color: '#4dabf7' }}>VIEW SITE</Link> | <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' });
              router.push('/admin/login');
            }}
            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '13px' }}
          >LOG OUT</button>
        </div>
      </header>

      <div className="admin-main">
        <nav className="admin-sidebar">
          {isLoading ? (
            <div style={{ padding: '20px', color: '#8888a0' }}>Loading...</div>
          ) : (
            Object.entries(groupedTables).map(([group, groupTables]) => (
              <div key={group} className="admin-nav-group">
                <div className="admin-nav-title">{group}</div>
                {groupTables.map((table) => (
                  <div key={table.name}>
                    <Link
                      href={`/admin/${table.name}`}
                      className={`admin-nav-item ${pathname === `/admin/${table.name}` ? 'active' : ''}`}
                    >
                      <span>{formatTableName(table.name)}</span>
                      <span className="admin-nav-count">{table.count}</span>
                    </Link>
                    <div className="admin-actions">
                      <Link href={`/admin/${table.name}/new`} className="admin-action-link">+ Add</Link>
                      <Link href={`/admin/${table.name}`} className="admin-action-link change">✎ Change</Link>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </nav>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
