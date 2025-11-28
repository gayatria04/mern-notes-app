import { useState, useEffect } from "react";
import NoteForm from "./Noteform.jsx"
import Note from "./Note.jsx";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [editNote, setEditNote] = useState(null);

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
    setNotes(savedNotes);
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  const addNote = (note) => {
    setNotes([...notes, note]);
  };

  const updateNote = (updatedNote) => {
    setNotes(notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    setEditNote(null);
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const clearAll = () => {
    if (window.confirm("Are you sure you want to delete all notes?")) {
      setNotes([]);
    }
  };

  return (
    <div className="container">
      <h1>📝 Fancy Notes App</h1>
      <NoteForm addNote={addNote} editNote={editNote} updateNote={updateNote} />
      {notes.length > 0 && (
        <button className="clear-btn" onClick={clearAll}>
          Clear All Notes
        </button>
      )}
      <div className="notes-list">
        {notes.length === 0 ? (
          <p className="no-notes">No notes yet! Add something above ✨</p>
        ) : (
          notes.map((note) => (
            <Note
              key={note.id}
              note={note}
              deleteNote={deleteNote}
              setEditNote={setEditNote}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default App;
