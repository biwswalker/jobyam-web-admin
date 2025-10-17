import { t } from '../locales';
import { useLanguage } from '~/components/DashboardLayout';
import type { AgentStaffOption, AgentStaffSelectProps } from '../models/agent-staff';
import { roleColors } from '../models/agent-staff';
import { updateAssignedAdmin } from '../services/applicants';
import React, { useState, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon, UserCircleIcon } from '@heroicons/react/outline';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AgentStaffSelect({ value, onChange, options, assignedId, disabled = false }: AgentStaffSelectProps) {
  const { language } = useLanguage();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedOption = options.find(opt => opt.id === value);
  const isUnassigned = value === '';

  const handleChange = (newId: string) => {
    if (newId === value) return;
    if (!newId) return onChange('');
    setPendingId(newId);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingId || !assignedId) return;
    setConfirmOpen(false);
    try {
      await updateAssignedAdmin({
        id: assignedId,
        assigned: pendingId,
        agentKey: options.find(opt => opt.id === pendingId)?.agentKey
      });
      onChange(pendingId);
    } catch (err) {
      setToast({ 
        message: t('changeAdmin_failed', language) || 'Failed to change admin', 
        type: 'error' 
      });
    } finally {
      setPendingId(null);
    }
  };

  const handleCancel = () => {
    setConfirmOpen(false);
    setPendingId(null);
  };

  return (
    <div className="w-full">
      <Listbox value={value} onChange={handleChange} disabled={disabled || options.length === 0}>
        {({ open }) => (
            <div className="relative">
              <Listbox.Button 
                className={classNames(
                  isUnassigned 
                    ? 'bg-red-50 border-red-300 text-red-700 ring-red-300' 
                    : 'bg-white border-gray-300 text-gray-900',
                  'relative w-full cursor-default rounded-lg border py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm'
                )}
              >
                <div className="flex items-center">
                  <UserCircleIcon 
                    className={classNames(
                      isUnassigned ? 'text-red-400' : 'text-gray-400',
                      'h-5 w-5 flex-shrink-0 mr-2'
                    )} 
                    aria-hidden="true" 
                  />
                  <span className="block truncate">
                    {selectedOption ? (
                      <span className="flex flex-col">
                        <span className="font-medium">{selectedOption.name}</span>
                        <span className="text-xs text-gray-500">{selectedOption.phone}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">{t('changeAdmin', language)}</span>
                    )}
                  </span>
                </div>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>

              <div className="relative">
                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options 
                    className="fixed z-[9999] mt-1 w-[280px] max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                    style={{
                      transform: 'translateY(4px)'
                    }}
                  >
                  <Listbox.Option
                    key="unassigned"
                    className={({ active }) =>
                      classNames(
                        active ? 'bg-teal-50' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value=""
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center">
                          <span
                            className={classNames(
                              selected ? 'font-semibold' : 'font-normal',
                              'block truncate text-gray-700'
                            )}
                          >
                            {t('unassigned', language) || 'Unassigned'}
                          </span>
                        </div>
                        {selected ? (
                          <span
                            className={classNames(
                              'absolute inset-y-0 right-0 flex items-center pr-4 text-teal-600'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                  
                  {options.map((option) => (
                    <Listbox.Option
                      key={option.id}
                      className={({ active }) =>
                        classNames(
                          active ? 'bg-teal-50' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-3 pr-9'
                        )
                      }
                      value={option.id}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center">
                            <div className={classNames(
                              'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium mr-3',
                              roleColors[option.role] || 'bg-gray-100 text-gray-800'
                            )}>
                              {option.role === 'staff' ? 'S' : 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {option.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {option.phone}
                              </p>
                            </div>
                          </div>
                          {selected ? (
                            <span
                              className={classNames(
                                'absolute inset-y-0 right-0 flex items-center pr-4 text-teal-600'
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </div>
        )}
      </Listbox>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <ConfirmDialog
        open={confirmOpen}
        title={t('changeAdmin', language) || 'Change Admin'}
        message={t('confirm_changeAdmin', language) || 'Are you sure you want to change the admin?'}
        fromName={options.find(opt => opt.id === value)?.name || t('unassigned', language) || 'Unassigned'}
        toName={options.find(opt => opt.id === pendingId)?.name || t('unassigned', language) || 'Unassigned'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
