import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import StickyNoteNode from '../components/StickyNoteNode';
import { toast } from "sonner";
import {
    StickyNote as StickyNoteIcon,
    Plus,
    LayoutDashboard,
    ListTodo,
    Settings,
    LogOut,
    Sun,
    Moon,
    CheckCircle
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const nodeTypes = {
    stickyNote: StickyNoteNode,
};

const StickyNotesPage = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // React Flow State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    const saveTimeouts = useRef({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [notesRes, edgesRes] = await Promise.all([
                axios.get(`${API}/notes`, { withCredentials: true }),
                axios.get(`${API}/edges`, { withCredentials: true })
            ]);

            // Transform Notes to Nodes
            const initialNodes = notesRes.data.map(note => ({
                id: note.note_id,
                type: 'stickyNote',
                position: { x: note.x_position, y: note.y_position },
                data: {
                    content: note.content,
                    color: note.color,
                    updateNote: (updates) => updateNoteHandler(note.note_id, updates),
                    deleteNote: () => deleteNoteHandler(note.note_id)
                },
            }));

            // Transform Edges
            const initialEdges = edgesRes.data.map(edge => ({
                id: edge.edge_id,
                source: edge.source,
                target: edge.target,
                type: 'default',
            }));

            setNodes(initialNodes);
            setEdges(initialEdges);
        } catch (error) {
            console.error("Error loading board:", error);
            toast.error("Failed to load board");
        } finally {
            setLoading(false);
        }
    };

    const updateNoteHandler = (id, updates) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...updates,
                        },
                    };
                }
                return node;
            })
        );

        // Debounce save
        if (saveTimeouts.current[id]) clearTimeout(saveTimeouts.current[id]);
        saveTimeouts.current[id] = setTimeout(async () => {
            // If we're updating content/color via the custom node internal state
            try {
                await axios.put(`${API}/notes/${id}`, updates, { withCredentials: true });
            } catch (err) { console.error(err); }
        }, 1000);
    };

    const onConnect = useCallback(
        async (params) => {
            const tempId = `e-${Date.now()}`;
            const newEdge = { ...params, id: tempId };
            setEdges((eds) => addEdge(newEdge, eds));

            try {
                const res = await axios.post(`${API}/edges`, { source: params.source, target: params.target }, { withCredentials: true });
                // Replace temp edge with real one if needed, but for now just saving is enough
                setEdges((eds) => eds.map(e => e.id === tempId ? { ...e, id: res.data.edge_id } : e));
            } catch (error) {
                console.error("Failed to save edge", error);
                toast.error("Failed to connect notes");
            }
        },
        [setEdges],
    );

    const onEdgesDelete = useCallback(async (edgesToDelete) => {
        for (const edge of edgesToDelete) {
            try {
                await axios.delete(`${API}/edges/${edge.id}`, { withCredentials: true });
            } catch (err) { console.error(err); }
        }
    }, []);

    const onNodeDragStop = useCallback((event, node) => {
        const updates = { x_position: Math.round(node.position.x), y_position: Math.round(node.position.y) };
        axios.put(`${API}/notes/${node.id}`, updates, { withCredentials: true })
            .catch(err => console.error("Failed to save position", err));
    }, []);

    const deleteNoteHandler = async (id) => {
        try {
            await axios.delete(`${API}/notes/${id}`, { withCredentials: true });
            setNodes((nds) => nds.filter((n) => n.id !== id));
            toast.success("Note deleted");
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error("Failed to delete note");
        }
    };

    const addNote = async () => {
        try {
            const newNote = {
                content: "",
                color: "yellow",
                x_position: Math.floor(Math.random() * 400),
                y_position: Math.floor(Math.random() * 400),
            };
            const res = await axios.post(`${API}/notes`, newNote, { withCredentials: true });

            const newNode = {
                id: res.data.note_id,
                type: 'stickyNote',
                position: { x: res.data.x_position, y: res.data.y_position },
                data: {
                    content: res.data.content,
                    color: res.data.color,
                    updateNote: (updates) => updateNoteHandler(res.data.note_id, updates),
                    deleteNote: () => deleteNoteHandler(res.data.note_id)
                },
            };
            setNodes((nds) => nds.concat(newNode));
        } catch (error) {
            console.error(error);
            toast.error("Failed to create note");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Board...</div>;

    return (
        <div className="h-screen w-screen flex flex-col bg-background">
            {/* Navigation Bar (Floating or Fixed) */}
            <nav className="h-16 border-b border-border flex items-center justify-between px-6 bg-background z-50">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
                    <span className="font-semibold text-lg tracking-tight font-['Outfit']">Checktick Board</span>
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
                    <Link to="/settings">
                        <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                </div>
            </nav>

            {/* React Flow Canvas */}
            <div className="flex-1 w-full relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDragStop={onNodeDragStop}
                    onEdgesDelete={onEdgesDelete}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-background/50"
                >
                    <Background color="#888" gap={16} />
                    <Controls />
                    <MiniMap />
                </ReactFlow>

                {/* Floating Add Button */}
                <div className="absolute bottom-8 right-8 z-[100]">
                    <Button onClick={addNote} className="shadow-lg rounded-full w-14 h-14 p-0">
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StickyNotesPage;
