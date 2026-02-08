'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Record {
  id: string;
  [key: string]: any;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TableListPage({ params }: { params: { table: string } }) {
  const { table } = params;
  const [records, setRecords] = useState<Record[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    fetchRecords(1);
  }, [table]);

  const fetchRecords = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin?table=${table}&page=${page}&limit=20`);
      const data = await res.json();
      setRecords(data.records || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTableName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const res = await fetch(`/api/admin?table=${table}&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRecords(pagination.page);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      alert('Failed to delete record');
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const columns = records.length > 0 ? Object.keys(records[0]).slice(0, 6) : [];

  return (
    <div className="table-list">
      <style jsx>{`
        .table-list {
          background: #1a1a2e;
          border-radius: 8px;
          border: 1px solid #2d2d44;
        }
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #2d2d44;
        }
        .table-title {
          font-size: 18px;
          font-weight: 500;
          color: #ffffff;
        }
        .add-btn {
          background: #69db7c;
          color: #0f0f1a;
          padding: 8px 16px;
          border-radius: 4px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: background 0.15s;
        }
        .add-btn:hover {
          background: #b2f2bb;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table th {
          text-align: left;
          padding: 12px 16px;
          background: #16213e;
          color: #8888a0;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #2d2d44;
        }
        .data-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #2d2d44;
          font-size: 13px;
          color: #c0c0d0;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .data-table tr:hover td {
          background: #2d2d44;
        }
        .record-link {
          color: #4dabf7;
          text-decoration: none;
        }
        .record-link:hover {
          text-decoration: underline;
        }
        .actions-cell {
          display: flex;
          gap: 12px;
        }
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.15s;
        }
        .edit-btn {
          color: #4dabf7;
          background: rgba(77, 171, 247, 0.1);
        }
        .edit-btn:hover {
          background: rgba(77, 171, 247, 0.2);
        }
        .delete-btn {
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
        }
        .delete-btn:hover {
          background: rgba(255, 107, 107, 0.2);
        }
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid #2d2d44;
        }
        .page-info {
          color: #8888a0;
          font-size: 13px;
        }
        .page-btns {
          display: flex;
          gap: 8px;
        }
        .page-btn {
          background: #2d2d44;
          color: #c0c0d0;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }
        .page-btn:hover:not(:disabled) {
          background: #4a4a68;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .loading, .empty {
          padding: 40px;
          text-align: center;
          color: #8888a0;
        }
        .breadcrumb {
          margin-bottom: 16px;
          font-size: 13px;
        }
        .breadcrumb a {
          color: #4dabf7;
          text-decoration: none;
        }
        .breadcrumb span {
          color: #8888a0;
          margin: 0 8px;
        }
      `}</style>

      <div className="breadcrumb">
        <Link href="/admin">Home</Link>
        <span>›</span>
        {formatTableName(table)}
      </div>

      <div className="table-header">
        <h1 className="table-title">Select {formatTableName(table).toLowerCase()} to change</h1>
        <Link href={`/admin/${table}/new`} className="add-btn">
          + Add {formatTableName(table).toLowerCase()}
        </Link>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : records.length === 0 ? (
        <div className="empty">No records found</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === records.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                {columns.map((col) => (
                  <th key={col}>{col.replace(/_/g, ' ')}</th>
                ))}
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(record.id)}
                      onChange={() => toggleSelect(record.id)}
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col}>
                      {col === 'id' ? (
                        <Link href={`/admin/${table}/${record.id}`} className="record-link">
                          {String(record[col]).substring(0, 8)}...
                        </Link>
                      ) : (
                        typeof record[col] === 'object'
                          ? JSON.stringify(record[col]).substring(0, 30) + '...'
                          : String(record[col] ?? '').substring(0, 50)
                      )}
                    </td>
                  ))}
                  <td>
                    <div className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => router.push(`/admin/${table}/${record.id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(record.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <div className="page-info">
              Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="page-btns">
              <button
                className="page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchRecords(pagination.page - 1)}
              >
                ← Previous
              </button>
              <button
                className="page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchRecords(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
