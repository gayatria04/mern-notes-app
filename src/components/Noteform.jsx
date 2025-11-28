import { useState, useEffect } from "react";

function NoteForm({ addNote, editNote, updateNote }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (editNote) {
      setTitle(editNote.title);
      setContent(editNote.content);
    }
  }, [editNote]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !content) return;

    if (editNote) {
      updateNote({ ...editNote, title, content });
    } else {
      addNote({ id: Date.now(), title, content });
    }

    setTitle("");
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      ></textarea>
      <button type="submit">{editNote ? "Update Note" : "Add Note"}</button>
    </form>
  );
}

export default NoteForm;
