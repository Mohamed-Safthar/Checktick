import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Draggable from "react-draggable";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import {
    StickyNote as StickyNoteIcon,
    Plus,
    Trash2,
    X,
    CheckCircle,
    ListTodo,
    Settings,
    LogOut,
    Sun,
    Moon,
    Move,
    LayoutDashboard
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const COLORS = [
    { name: "yellow", bg: "bg-[#FFEB3B]", text: "text-black" },
    { name: "cyan", bg: "bg-[#00BCD4]", text: "text-black" },
    { name: "green", bg: "bg-[#4CAF50]", text: "text-white" },
    { name: "pink", bg: "bg-[#E91E63]", text: "text-white" },
    { name: "purple", bg: "bg-[#9C27B0]", text: "text-white" },
];

// Extracted component to handle nodeRef for React 19 compatibility
const StickyNoteItem = ({ note, updateNoteLocal, handleStopDrag, deleteNote, bringToFront }) => {
    const nodeRef = useRef(null);
    const colorObj = COLORS.find(c => c.name === note.color) || COLORS[0];

    return (
        <Draggable
            nodeRef={nodeRef}
            key={note.note_id}
            defaultPosition={{ x: note.x_position, y: note.y_position }}
            onStop={(e, data) => handleStopDrag(e, data, note.note_id)}
            onStart={() => bringToFront(note.note_id)}
            handle=".drag-handle"
            bounds="parent"
        >
            <div
                ref={nodeRef}
                className={`absolute w-[250px] min-h-[250px] shadow-xl rounded-sm flex flex-col ${colorObj.bg} ${colorObj.text}`}
                style={{ zIndex: note.z_index }}
            >
                {/* Header / Handle */}
                <div className="drag-handle cursor-move p-3 flex items-center justify-between border-b border-black/10">
                    <Move className="w-4 h-4 opacity-50" />
                    <div className="flex items-center gap-1">
                        {COLORS.map(c => (
                            <button
                                key={c.name}
                                className={`w-3 h-3 rounded-full border border-black/20 ${c.bg}`}
                                onClick={() => updateNoteLocal(note.note_id, { color: c.name })}
                            />
                        ))}
                    </div>
                    <button onClick={() => deleteNote(note.note_id)} className="opacity-50 hover:opacity-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <textarea
                    className="flex-1 w-full bg-transparent border-none resize-none p-4 focus:outline-none font-[400] text-lg leading-relaxed placeholder-black/30 font-['Handlee',_cursive]"
                    value={note.content}
                    onChange={(e) => updateNoteLocal(note.note_id, { content: e.target.value })}
                    placeholder="Type something..."
                    style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
                />
            </div>
        </Draggable>
    );
};

const StickyNotesPage = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Ref to track saving timeout for debouncing
    const saveTimeouts = useRef({});

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const res = await axios.get(`${API}/notes`, { withCredentials: true });
            setNotes(res.data);
        } catch (error) {
            console.error("Error fetching notes:", error);
            toast.error("Failed to load notes");
        } finally {
            setLoading(false);
        }
    };

    const createNote = async () => {
        try {
            const newNote = {
                content: "New Note",
                color: "yellow",
                x_position: Math.floor(Math.random() * 200),
                y_position: Math.floor(Math.random() * 200),
                z_index: notes.length + 1
            };

            const res = await axios.post(`${API}/notes`, newNote, { withCredentials: true });
            setNotes([...notes, res.data]);
            toast.success("Note added");
        } catch (error) {
            console.error("Error creating note:", error);
            toast.error("Failed to create note");
        }
    };

    const updateNoteLocal = (id, updates) => {
        setNotes(notes.map(n => n.note_id === id ? { ...n, ...updates } : n));

        // Debounce save
        if (saveTimeouts.current[id]) clearTimeout(saveTimeouts.current[id]);

        saveTimeouts.current[id] = setTimeout(async () => {
            try {
                await axios.put(`${API}/notes/${id}`, updates, { withCredentials: true });
            } catch (error) {
                console.error("Error saving note:", error);
            }
        }, 1000);
    };

    const handleStopDrag = (e, data, id) => {
        // Immediate save on drag stop
        const updates = { x_position: data.x, y_position: data.y };
        setNotes(notes.map(n => n.note_id === id ? { ...n, ...updates } : n));

        axios.put(`${API}/notes/${id}`, updates, { withCredentials: true })
            .catch(err => console.error("Failed to save position", err));
    };

    const deleteNote = async (id) => {
        try {
            await axios.delete(`${API}/notes/${id}`, { withCredentials: true });
            setNotes(notes.filter(n => n.note_id !== id));
            toast.success("Note deleted");
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error("Failed to delete note");
        }
    };

    const bringToFront = (id) => {
        const maxZ = Math.max(...notes.map(n => n.z_index || 0), 0) + 1;
        updateNoteLocal(id, { z_index: maxZ });
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-background relative overflow-hidden" data-testid="sticky-notes-page">
            {/* Navigation - Reusing the style from Dashboard */}
            <nav className="sticky top-0 z-50 glass mb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
                            <span className="font-semibold text-lg tracking-tight font-['Outfit']">Checktick</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Link to="/dashboard">
                                <Button variant="ghost" size="sm">
                                    <LayoutDashboard className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link to="/tasks">
                                <Button variant="ghost" size="sm">
                                    <ListTodo className="w-4 h-4 mr-2" />
                                    Tasks
                                </Button>
                            </Link>
                            <Link to="/notes">
                                <Button variant="secondary" size="sm">
                                    <StickyNoteIcon className="w-4 h-4 mr-2" />
                                    Notes
                                </Button>
                            </Link>
                            <Link to="/settings">
                                <Button variant="ghost" size="sm">
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={toggleTheme}>
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={logout}>
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Canvas Area */}
            <div className="relative w-full h-[calc(100vh-80px)] p-4">

                {/* Helper Text */}
                {notes.length === 0 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-muted-foreground outline-dashed outline-2 outline-muted rounded-xl p-12">
                        <StickyNoteIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-medium mb-2">No notes yet</h3>
                        <p className="mb-6">Click the button below to create your first sticky note.</p>
                        <Button onClick={createNote}>
                            <Plus className="w-4 h-4 mr-2" /> Create Note
                        </Button>
                    </div>
                )}

                {/* FAB for creating note if notes exist */}
                {notes.length > 0 && (
                    <Button
                        onClick={createNote}
                        className="fixed bottom-8 right-8 shadow-lg z-[1000] rounded-full w-14 h-14 p-0"
                    >
                        <Plus className="w-6 h-6" />
                    </Button>
                )}

                {notes.map((note) => (
                    <StickyNoteItem
                        key={note.note_id}
                        note={note}
                        updateNoteLocal={updateNoteLocal}
                        handleStopDrag={handleStopDrag}
                        deleteNote={deleteNote}
                        bringToFront={bringToFront}
                    />
                ))}
            </div>
        </div>
    );
};

export default StickyNotesPage;
