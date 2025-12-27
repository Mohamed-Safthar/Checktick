import React, { memo, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { X, Move } from 'lucide-react';

const COLORS = [
    { name: "yellow", bg: "bg-[#FFEB3B]", text: "text-black" },
    { name: "cyan", bg: "bg-[#00BCD4]", text: "text-black" },
    { name: "green", bg: "bg-[#4CAF50]", text: "text-white" },
    { name: "pink", bg: "bg-[#E91E63]", text: "text-white" },
    { name: "purple", bg: "bg-[#9C27B0]", text: "text-white" },
];

const StickyNoteNode = ({ data, selected }) => {
    const { content, color, updateNote, deleteNote } = data;
    const colorObj = COLORS.find(c => c.name === color) || COLORS[0];
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset to recalculate
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [content]);

    return (
        <div
            className={`shadow-xl rounded-sm flex flex-col ${colorObj.bg} ${colorObj.text} min-w-[200px] max-w-[400px] transition-all duration-200`}
            style={{
                border: selected ? '2px solid blue' : 'none',
                height: 'auto'
            }}
        >
            {/* Connection Handles - Visible only when selected */}
            <Handle
                type="target"
                position={Position.Top}
                className={`!w-3 !h-3 !bg-blue-500 -top-1.5 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`}
            />
            <Handle
                type="target"
                position={Position.Left}
                className={`!w-3 !h-3 !bg-blue-500 -left-1.5 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`}
            />
            <Handle
                type="target"
                position={Position.Right}
                className={`!w-3 !h-3 !bg-blue-500 -right-1.5 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`}
            />
            <Handle
                type="target"
                position={Position.Bottom}
                className={`!w-3 !h-3 !bg-blue-500 -bottom-1.5 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`}
            />

            <Handle
                type="source"
                position={Position.Top}
                className={`!w-3 !h-3 !bg-blue-500 -top-1.5 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`}
            />
            <Handle
                type="source"
                position={Position.Left}
                className={`!w-3 !h-3 !bg-blue-500 -left-1.5 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`}
            />
            <Handle
                type="source"
                position={Position.Right}
                className={`!w-3 !h-3 !bg-blue-500 -right-1.5 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-3 !h-3 !bg-blue-500 -bottom-1.5 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Header */}
            <div className="drag-handle cursor-move p-3 flex items-center justify-between border-b border-black/10">
                <Move className="w-4 h-4 opacity-50" />
                <div className="flex items-center gap-1">
                    {COLORS.map(c => (
                        <button
                            key={c.name}
                            className={`w-3 h-3 rounded-full border border-black/20 ${c.bg}`}
                            onClick={() => updateNote({ color: c.name })}
                        />
                    ))}
                </div>
                <button onClick={deleteNote} className="opacity-50 hover:opacity-100 nodrag">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content with Auto-Size */}
            <textarea
                ref={textareaRef}
                className="w-full bg-transparent border-none resize-none p-4 focus:outline-none font-[400] text-lg leading-relaxed placeholder-black/30 font-['Handlee',_cursive] nodrag overflow-hidden"
                value={content}
                onChange={(e) => updateNote({ content: e.target.value })}
                placeholder="Type here..."
                style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
                rows={1}
            />
        </div>
    );
};

export default memo(StickyNoteNode);
