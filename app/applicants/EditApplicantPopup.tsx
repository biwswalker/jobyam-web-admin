import React from 'react';
import { useLanguage } from "~/components/DashboardLayout";
import { t } from "~/locales";

interface EditApplicantPopupProps {
  open: boolean;
  onClose: () => void;
  applicant?: any; // Replace 'any' with your applicant type if available
  onSave?: (data: any) => void;
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  maxWidth: 400,
  width: '90%',
  boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
  padding: 24,
  position: 'relative',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 24,
};

const formatDateForInput = (dateString: string | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const EditApplicantPopup: React.FC<EditApplicantPopupProps> = ({ open, onClose, applicant, onSave }) => {
  const { language } = useLanguage();
  const [form, setForm] = React.useState<any>(applicant);

  React.useEffect(() => {
    setForm(applicant);
  }, [applicant]);

  if (!open || !form) return null;

  return (
    <div style={{
      ...modalOverlayStyle,
      background: 'rgba(30, 41, 59, 0.42)', // subtle dark overlay
      minHeight: '100vh',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      transition: 'backdrop-filter 0.3s',
    }}>
      <div style={{
        ...modalStyle,
        background: 'white',
        borderRadius: 18,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: 32,
        position: 'relative',
        maxWidth: 420,
        margin: '40px auto',
        overflow: 'hidden',
      }}>
        <h2 style={{
          marginTop: 0,
          marginBottom: 24,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: 0.5,
          textAlign: 'center',
          color: '#222',
        }}>{t('edit_applicant', language)}</h2>
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={{ marginBottom: 4, fontWeight: 600, color: '#222', fontSize: 15, letterSpacing: 0.5 }}>
            {t('name', language)}
            <input
              type="text"
              value={form?.name || ''}
              onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 14px',
                marginTop: 6,
                border: 'none',
                borderRadius: 12,
                background: 'linear-gradient(90deg, #e0f7fa 0%, #f3e8ff 100%)',
                boxShadow: '0 2px 8px #2563eb22',
                fontSize: 16,
                outline: 'none',
                transition: 'box-shadow 0.2s',
                color: '#222',
              }}
              onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #2563eb')}
              onBlur={e => (e.currentTarget.style.boxShadow = '0 2px 8px #2563eb22')}
            />
          </label>
          <label style={{ marginBottom: 4, fontWeight: 600, color: '#222', fontSize: 15, letterSpacing: 0.5 }}>
            {t('phone', language)}
            <input
              type="tel"
              value={form?.phone || ''}
              onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 14px',
                marginTop: 6,
                border: 'none',
                borderRadius: 12,
                background: 'linear-gradient(90deg, #e0f7fa 0%, #f3e8ff 100%)',
                boxShadow: '0 2px 8px #2563eb22',
                fontSize: 16,
                outline: 'none',
                transition: 'box-shadow 0.2s',
                color: '#222',
              }}
              onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #2563eb')}
              onBlur={e => (e.currentTarget.style.boxShadow = '0 2px 8px #2563eb22')}
            />
          </label>
          <label style={{ marginBottom: 4, fontWeight: 600, color: '#222', fontSize: 15, letterSpacing: 0.5 }}>
            {t('birthday', language)}
            <input
              type="date"
              value={formatDateForInput(form?.birthDay)}
              onChange={e => setForm((f: any) => ({ ...f, birthDay: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 14px',
                marginTop: 6,
                border: 'none',
                borderRadius: 12,
                background: 'linear-gradient(90deg, #e0f7fa 0%, #f3e8ff 100%)',
                boxShadow: '0 2px 8px #2563eb22',
                fontSize: 16,
                outline: 'none',
                transition: 'box-shadow 0.2s',
                color: '#222',
              }}
              onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #2563eb')}
              onBlur={e => (e.currentTarget.style.boxShadow = '0 2px 8px #2563eb22')}
            />
          </label>
          <label style={{ marginBottom: 4, fontWeight: 600, color: '#222', fontSize: 15, letterSpacing: 0.5 }}>
            {t('contact_name', language)}
            <input
              type="text"
              value={form?.contactName || ''}
              onChange={e => setForm((f: any) => ({ ...f, contactName: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 14px',
                marginTop: 6,
                border: 'none',
                borderRadius: 12,
                background: 'linear-gradient(90deg, #f3e8ff 0%, #e0f7fa 100%)',
                boxShadow: '0 2px 8px #2563eb22',
                fontSize: 16,
                outline: 'none',
                transition: 'box-shadow 0.2s',
                color: '#222',
              }}
              onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #2563eb')}
              onBlur={e => (e.currentTarget.style.boxShadow = '0 2px 8px #2563eb22')}
            />
          </label>
          <label style={{ marginBottom: 4, fontWeight: 600, color: '#222', fontSize: 15, letterSpacing: 0.5 }}>
            {t('contact_number', language)}
            <input
              type="tel"
              value={form?.contactNumber || ''}
              onChange={e => setForm((f: any) => ({ ...f, contactNumber: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 14px',
                marginTop: 6,
                border: 'none',
                borderRadius: 12,
                background: 'linear-gradient(90deg, #f3e8ff 0%, #e0f7fa 100%)',
                boxShadow: '0 2px 8px #2563eb22',
                fontSize: 16,
                outline: 'none',
                transition: 'box-shadow 0.2s',
                color: '#222',
              }}
              onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #2563eb')}
              onBlur={e => (e.currentTarget.style.boxShadow = '0 2px 8px #2563eb22')}
            />
          </label>
          <label style={{ marginBottom: 4, fontWeight: 600, color: '#222', fontSize: 15, letterSpacing: 0.5 }}>
            {t('relationship', language)}
            <input
              type="text"
              value={form?.relationship || ''}
              onChange={e => setForm((f: any) => ({ ...f, relationship: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 14px',
                marginTop: 6,
                border: 'none',
                borderRadius: 12,
                background: 'linear-gradient(90deg, #f3e8ff 0%, #e0f7fa 100%)',
                boxShadow: '0 2px 8px #2563eb22',
                fontSize: 16,
                outline: 'none',
                transition: 'box-shadow 0.2s',
                color: '#222',
              }}
              onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px #2563eb')}
              onBlur={e => (e.currentTarget.style.boxShadow = '0 2px 8px #2563eb22')}
            />
          </label>
        </div>
        <div style={{
          ...buttonRowStyle,
          marginTop: 32,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 22px',
              background: 'linear-gradient(90deg, #e0eafc 0%, #cfdef3 100%)',
              color: '#222',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              marginRight: 10,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #2563eb22',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = '0 4px 16px #e0eafc';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(111,123,247,0.08)';
            }}
          >{t('cancel', language)}</button>
          <button
            onClick={() => onSave && onSave(form)}
            style={{
              padding: '10px 22px',
              background: 'linear-gradient(90deg, #0fd9d9 0%, #6f7bf7 100%)',
              color: '#222',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 4px 16px #0fd9d980',
              transition: 'transform 0.15s, box-shadow 0.15s',
              textShadow: '0 2px 8px #6f7bf7aa',
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 8px 24px #0fd9d9cc';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px #0fd9d980';
            }}
          >{t('save', language)}</button>
        </div>
      </div>
    </div>
  );
};

export default EditApplicantPopup;
