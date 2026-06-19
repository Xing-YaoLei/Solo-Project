import { useState, useEffect } from 'react';
import type { ReviewNote, NoteCreateData } from '../types';
import { fetchNotesByComplaint, createNote } from '../api';

interface NoteEditorProps {
  complaintId: string;
  anomalyFlagId?: string;
}

export default function NoteEditor({ complaintId, anomalyFlagId }: NoteEditorProps) {
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!complaintId) return;
    fetchNotesByComplaint(complaintId).then(setNotes).catch(() => {});
  }, [complaintId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const data: NoteCreateData = {
        complaintId,
        anomalyFlagId,
        content: content.trim(),
        author: 'current_user',
      };
      const newNote = await createNote(data);
      setNotes((prev) => [newNote, ...prev]);
      setContent('');
    } catch {
      // silently ignore
    } finally {
      setSubmitting(false);
    }
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="note-editor-panel">
      <h3>备注</h3>
      <div className="note-list">
        {sortedNotes.length === 0 && <div className="no-data">暂无备注</div>}
        {sortedNotes.map((note) => (
          <div key={note.id} className="note-item">
            <div className="note-meta">
              <span className="note-author">{note.author}</span>
              <span className="note-time">{note.createdAt}</span>
            </div>
            <div className="note-content">{note.content}</div>
          </div>
        ))}
      </div>
      <div className="note-input-row">
        <input
          type="text"
          placeholder="添加备注..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="note-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
        />
        <button
          className="note-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '...' : '提交'}
        </button>
      </div>
    </div>
  );
}
