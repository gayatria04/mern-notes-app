function Note({ note, deleteNote, setEditNote }) {
  return (
    <div className="note">
      <h3>{note.title}</h3>
      <p>{note.content}</p>
      <div className="note-actions">
        <button className="edit-btn" onClick={() => setEditNote(note)}>
          Edit
        </button>
        <button className="delete-btn" onClick={() => deleteNote(note.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default Note;
