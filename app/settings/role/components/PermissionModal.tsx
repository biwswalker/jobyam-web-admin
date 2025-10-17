import React, { useState } from 'react';
import type { Permission } from '../index';
import type { Role } from '../index';

interface PermissionModalProps {
  role: Role;
  permissions: Permission[];
  setPermissions: React.Dispatch<React.SetStateAction<Permission[]>>;
  loading: boolean;
  onClose: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  role,
  permissions,
  setPermissions,
  loading,
  onClose,
}) => {
  const [saving, setSaving] = useState(false);

  const handleToggle = (id: string) => {
    setPermissions((prev) =>
      prev.map((perm) =>
        perm.id === id ? { ...perm, active: !perm.active } : perm
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: ส่ง role.id และ permissions ไปยัง API จริง
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <h2 className="text-xl font-bold mb-4">Manage Permission: {role.name}</h2>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <form>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {permissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={perm.active}
                    onChange={() => handleToggle(perm.id)}
                    className="accent-teal-600"
                  />
                  <span className="font-medium">{perm.description}</span>
                  <span className="text-xs text-gray-400 ml-auto">{perm.name}</span>
                </label>
              ))}
            </div>
            <div className="flex cursor-pointer justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={saving}
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 cursor-pointer rounded bg-[var(--color-primary,#0038A8)] text-white"
                disabled={saving}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PermissionModal;
