'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Pencil, Check, X } from 'lucide-react';

interface ProfileDisplayNameEditorProps {
  initialName: string;
}

export function ProfileDisplayNameEditor({ initialName }: ProfileDisplayNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      setDraft(name);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: trimmed }),
      });
      if (!res.ok) throw new Error();
      setName(trimmed);
      setDraft(trimmed);
      setEditing(false);
      toast.success('Display name updated');
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(name);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  }

  const transition = reduceMotion
    ? { duration: 0.1 }
    : { type: 'spring' as const, stiffness: 350, damping: 28 };

  return (
    <div className="flex items-center justify-center gap-2 min-h-[2.5rem]">
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={transition}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={50}
              className="border-b border-purple-600 bg-transparent text-xl sm:text-2xl font-bold text-white text-center outline-none min-w-0 w-auto"
              style={{ width: `${Math.max(draft.length, 1)}ch` }}
              disabled={saving}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full p-1.5 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              aria-label="Save"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={transition}
            className="flex items-center gap-2"
          >
            <h1 className="text-xl sm:text-2xl font-bold text-white">{name}</h1>
            <button
              onClick={() => setEditing(true)}
              className="rounded-full p-1.5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Edit display name"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
