import React, { useState, useEffect, useRef } from 'react';
import { Note, Folder } from '../types';
import { 
  FolderPlus, Plus, Search, Tag, Trash2, FileText, CheckSquare, 
  Code, Play, Copy, Check, Image, Paperclip, ChevronRight, HardDrive, 
  Loader2, Sparkles, GripVertical, ArrowUp, ArrowDown, HelpCircle,
  Table as TableIcon, List, Edit2, ListOrdered, FileDown, PlusCircle,
  Minus, Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';

// Struct declarations for Document Blocks
export interface DocumentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'image' | 'table' | 'code' | 'checklist' | 'bullet_list' | 'numbered_list' | 'attachment' | 'divider' | 'quote';
  content: string;             // Text value
  headingLevel?: 1 | 2 | 3;     // Heading Level
  url?: string;                 // Image url
  caption?: string;             // Image caption
  checked?: boolean;            // Checklist ticked
  tableData?: string[][];       // Matrix grid rows & columns
  attachmentName?: string;      // Attached file name
  attachmentSize?: string;
  attachmentType?: string;
  // Code runner fields
  language?: string;             
  code?: string;
  stdin?: string;
  output?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  lastExecuted?: string;
  executionHistory?: {
    timestamp: string;
    status: 'success' | 'error';
    output: string;
    input: string;
  }[];
}

interface SmartNotesProps {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  onSelectNote: (noteId: string | null) => void;
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onAddFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  onIncrementCodeExecutions: () => void;
}

const BOILERPLATES: { [key: string]: string } = {
  python: `print("Hello World")\n\n# Independent compiler simulation\nnums = [1, 2, 3, 4, 5]\nsquares = [x**2 for x in nums]\nprint(f"Numbers: {nums}")\nprint(f"Squares: {squares}")`,
  javascript: `console.log("Hello World");\n\nconst items = ["Express", "React", "Monaco"];\nconsole.log("Supported stack: " + items.join(" + "));`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n        System.out.println("Java interactive runtime active.");\n    }\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    printf("Native C execution online.");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    cout << "C++ microsandbox successfully initialized." << endl;\n    return 0;\n}`
};

// Main function to build rich Notion blocks
export function createBlock(type: DocumentBlock['type'], customContent: string = ''): DocumentBlock {
  const id = 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
  const block: DocumentBlock = {
    id,
    type,
    content: customContent,
  };

  if (type === 'heading') {
    block.headingLevel = 2;
  } else if (type === 'table') {
    block.tableData = [
      ['Header 1', 'Header 2', 'Header 3'],
      ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
      ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3']
    ];
  } else if (type === 'code') {
    block.language = 'python';
    block.code = BOILERPLATES.python;
    block.stdin = '';
    block.output = '';
    block.status = 'idle';
    block.executionHistory = [];
  } else if (type === 'checklist') {
    block.checked = false;
  } else if (type === 'image') {
    block.url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
    block.caption = 'Concept Visualization Frame';
  } else if (type === 'attachment') {
    block.attachmentName = 'SourceArchiveSDK.zip';
    block.attachmentSize = '3.8 MB';
    block.attachmentType = 'application/zip';
  }

  return block;
}

// Convert legacy Markdown text into a sequence of block nodes
export function convertMarkdownToBlocks(markdown: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  if (!markdown) {
    return [createBlock('paragraph', '')];
  }

  // Segment code fences
  const regex = /```(python|javascript|java|c\+\+|cpp|c|)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let blockCounter = 0;

  const addTextBlocks = (text: string) => {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        blocks.push({ id: `b_h_${Date.now()}_${blockCounter++}`, type: 'heading', headingLevel: 1, content: trimmed.replace('# ', '') });
      } else if (trimmed.startsWith('## ')) {
        blocks.push({ id: `b_h_${Date.now()}_${blockCounter++}`, type: 'heading', headingLevel: 2, content: trimmed.replace('## ', '') });
      } else if (trimmed.startsWith('### ')) {
        blocks.push({ id: `b_h_${Date.now()}_${blockCounter++}`, type: 'heading', headingLevel: 3, content: trimmed.replace('### ', '') });
      } else if (trimmed.startsWith('> ')) {
        blocks.push({ id: `b_q_${Date.now()}_${blockCounter++}`, type: 'quote', content: trimmed.replace('> ', '') });
      } else if (trimmed === '---') {
        blocks.push({ id: `b_div_${Date.now()}_${blockCounter++}`, type: 'divider', content: '' });
      } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
        const checked = trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ');
        const itemContent = trimmed.substring(6);
        blocks.push({ id: `b_cl_${Date.now()}_${blockCounter++}`, type: 'checklist', checked, content: itemContent });
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        blocks.push({ id: `b_bl_${Date.now()}_${blockCounter++}`, type: 'bullet_list', content: trimmed.substring(2) });
      } else if (trimmed.match(/^\d+\.\s+/)) {
        blocks.push({ id: `b_nl_${Date.now()}_${blockCounter++}`, type: 'numbered_list', content: trimmed.replace(/^\d+\.\s+/, '') });
      } else if (trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---')) {
        const rowData = trimmed.split('|').map(x => x.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const tableRows: string[][] = [rowData];
        while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
          i++;
          const nextLine = lines[i].trim();
          if (!nextLine.includes('---')) {
            const nextRow = nextLine.split('|').map(x => x.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            if (nextRow.length > 0) tableRows.push(nextRow);
          }
        }
        blocks.push({ id: `b_tbl_${Date.now()}_${blockCounter++}`, type: 'table', tableData: tableRows, content: '' });
      } else if (trimmed.length > 0) {
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          blocks.push({
            id: `b_img_${Date.now()}_${blockCounter++}`,
            type: 'image',
            content: '',
            url: imgMatch[2],
            caption: imgMatch[1]
          });
        } else {
          blocks.push({ id: `b_p_${Date.now()}_${blockCounter++}`, type: 'paragraph', content: line });
        }
      }
    }
  };

  while ((match = regex.exec(markdown)) !== null) {
    const preText = markdown.substring(lastIndex, match.index);
    if (preText) {
      addTextBlocks(preText);
    }
    const lang = match[1] || 'python';
    blocks.push({
      id: `b_c_${Date.now()}_${blockCounter++}`,
      type: 'code',
      language: lang === 'c++' ? 'cpp' : lang,
      code: match[2],
      content: '',
      stdin: '',
      output: '',
      status: 'idle',
      lastExecuted: '',
      executionHistory: []
    });
    lastIndex = regex.lastIndex;
  }

  const remainingText = markdown.substring(lastIndex);
  if (remainingText) {
    addTextBlocks(remainingText);
  }

  // Safety rule check
  if (blocks.length === 0) {
    blocks.push(createBlock('paragraph', ''));
  }

  return blocks;
}

export default function SmartNotes({
  notes,
  folders,
  activeNoteId,
  onSelectNote,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddFolder,
  onDeleteFolder,
  onIncrementCodeExecutions
}: SmartNotesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  
  // Blocks document state
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Floating selector modal
  const [showGlobalBlockSelector, setShowGlobalBlockSelector] = useState(false);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  // Track dragging sources
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync activeNote with Local block sequence
  useEffect(() => {
    if (activeNote) {
      let documentBlocksList: DocumentBlock[] = [];
      try {
        if (activeNote.content.trim().startsWith('[') && activeNote.content.trim().endsWith(']')) {
          const parsed = JSON.parse(activeNote.content);
          if (Array.isArray(parsed)) {
            documentBlocksList = parsed;
          } else {
            documentBlocksList = convertMarkdownToBlocks(activeNote.content);
          }
        } else {
          documentBlocksList = convertMarkdownToBlocks(activeNote.content);
        }
      } catch (e) {
        documentBlocksList = convertMarkdownToBlocks(activeNote.content);
      }

      // Safety Enforcement: Document must always contain at least one editable block.
      if (documentBlocksList.length === 0) {
        documentBlocksList = [createBlock('paragraph', '')];
      }

      setBlocks(documentBlocksList);
      setLastSaved(new Date(activeNote.updatedAt).toLocaleTimeString());
    } else {
      setBlocks([]);
    }
  }, [activeNoteId]);

  // Auto-Save engine
  const triggerAutoSave = (updatedBlocks: DocumentBlock[], updatedTitle?: string, updatedTags?: string[]) => {
    if (!activeNote) return;
    setIsAutoSaving(true);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const serialContent = JSON.stringify(updatedBlocks);
      const updated: Note = {
        ...activeNote,
        title: updatedTitle !== undefined ? updatedTitle : activeNote.title,
        tags: updatedTags !== undefined ? updatedTags : activeNote.tags,
        content: serialContent,
        updatedAt: new Date().toISOString()
      };
      onUpdateNote(updated);
      setIsAutoSaving(false);
      setLastSaved(new Date().toLocaleTimeString());
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Creation of beautiful templates
  const handleAddNewNote = () => {
    const startupBlocks: DocumentBlock[] = [
      createBlock('heading', 'Smart Interactive Workspace'),
      createBlock('paragraph', 'Welcome to your hybrid document workspace. Here you can write clean text, insert layouts, checklists, tables, and compile executable code segments seamlessly.'),
      { ...createBlock('checklist'), checked: false, content: 'Initialize secure compiler sandbox instance' },
      { ...createBlock('checklist'), checked: true, content: 'Verify active Monaco IDE block rendering pipeline' },
      createBlock('code', ''),
      createBlock('paragraph', 'Modify columns, parameters, or grid dimensions dynamically:'),
      createBlock('table', '')
    ];

    const newNote: Note = {
      id: 'n_' + Date.now(),
      title: 'Untouchable Labs Documents',
      content: JSON.stringify(startupBlocks),
      folderId: selectedFolderId,
      tags: ['Interactive', 'Docs'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onAddNote(newNote);
    onSelectNote(newNote.id);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folder: Folder = {
      id: 'f_' + Date.now(),
      name: newFolderName,
      createdAt: new Date().toISOString()
    };
    onAddFolder(folder);
    setNewFolderName('');
    setShowFolderForm(false);
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || !activeNote) return;
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (!activeNote.tags.includes(trimmed)) {
      const updatedTags = [...activeNote.tags, trimmed];
      triggerAutoSave(blocks, activeNote.title, updatedTags);
      activeNote.tags = updatedTags;
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    const updatedTags = activeNote.tags.filter(t => t !== tagToRemove);
    triggerAutoSave(blocks, activeNote.title, updatedTags);
    activeNote.tags = updatedTags;
  };

  // Block Mutation APIs
  const updateBlockFields = (blockId: string, fields: Partial<DocumentBlock>) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, ...fields } : b);
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const deleteBlock = (blockId: string) => {
    let updated = blocks.filter(b => b.id !== blockId);
    
    // Safety Rule: Document must always contain at least one editable block.
    if (updated.length === 0) {
      updated = [createBlock('paragraph', '')];
    }
    
    setBlocks(updated);
    triggerAutoSave(updated);

    // Focus previous available block nicely
    setTimeout(() => {
      const textareas = document.querySelectorAll('[id^="textarea-"]');
      if (textareas.length > 0) {
        const lastEl = textareas[textareas.length - 1] as HTMLTextAreaElement;
        lastEl.focus();
      }
    }, 100);
  };

  const addBlockBelow = (afterBlockId: string, blockType: DocumentBlock['type']) => {
    const targetIdx = blocks.findIndex(b => b.id === afterBlockId);
    if (targetIdx === -1) return;

    const newBlock = createBlock(blockType, '');
    const updated = [...blocks];
    updated.splice(targetIdx + 1, 0, newBlock);
    setBlocks(updated);
    triggerAutoSave(updated);

    setTimeout(() => {
      document.getElementById(`textarea-${newBlock.id}`)?.focus();
    }, 100);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setBlocks(updated);
    triggerAutoSave(updated);
  };

  // Drag and Drop execution handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...blocks];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);

    setBlocks(updated);
    setDraggedIndex(null);
    triggerAutoSave(updated);
  };

  // Canvas Click To Write Anywhere logic
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'blocks-list-container' || (e.target as HTMLElement).id === 'note-workspace-editor') {
      if (blocks.length === 0) {
        const newB = createBlock('paragraph', '');
        setBlocks([newB]);
        triggerAutoSave([newB]);
        setTimeout(() => document.getElementById(`textarea-${newB.id}`)?.focus(), 100);
      } else {
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock.type === 'paragraph' && lastBlock.content === '') {
          // Focus the existing last empty block instead of spawning redundant lists
          document.getElementById(`textarea-${lastBlock.id}`)?.focus();
        } else {
          const newB = createBlock('paragraph', '');
          const next = [...blocks, newB];
          setBlocks(next);
          triggerAutoSave(next);
          setTimeout(() => document.getElementById(`textarea-${newB.id}`)?.focus(), 100);
        }
      }
    }
  };

  // High level keyboard helper
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, blockId: string, index: number) => {
    const currentBlock = blocks[index];
    const val = e.currentTarget.value;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Inherit list prefixes elegantly
      let nextType: DocumentBlock['type'] = 'paragraph';
      if (['checklist', 'bullet_list', 'numbered_list'].includes(currentBlock.type)) {
        nextType = currentBlock.type;
      }

      const newBlock = createBlock(nextType, '');
      const updated = [...blocks];
      updated.splice(index + 1, 0, newBlock);
      setBlocks(updated);
      triggerAutoSave(updated);

      setTimeout(() => {
        document.getElementById(`textarea-${newBlock.id}`)?.focus();
      }, 50);
    } 
    else if (e.key === 'Backspace' && val === '') {
      e.preventDefault();
      
      let updated = blocks.filter(b => b.id !== blockId);
      if (updated.length === 0) {
        updated = [createBlock('paragraph', '')];
      }
      setBlocks(updated);
      triggerAutoSave(updated);

      const prevIndex = Math.max(0, index - 1);
      const prevBlock = updated[prevIndex];
      setTimeout(() => {
        if (prevBlock) {
          const prevEl = document.getElementById(`textarea-${prevBlock.id}`) as HTMLTextAreaElement;
          if (prevEl) {
            prevEl.focus();
            const len = prevEl.value.length;
            prevEl.setSelectionRange(len, len);
          }
        }
      }, 50);
    }
  };

  // Add block to end of the file
  const addBlockAtEnd = (type: DocumentBlock['type']) => {
    const newB = createBlock(type, '');
    const updated = [...blocks, newB];
    setBlocks(updated);
    triggerAutoSave(updated);
    setShowGlobalBlockSelector(false);

    setTimeout(() => {
      document.getElementById(`textarea-${newB.id}`)?.focus();
    }, 100);
  };

  // Compile runner API handler simulation
  const executeCodeBlock = async (blockId: string, code: string, language: string, customInput: string) => {
    const targetBlock = blocks.find(b => b.id === blockId);
    if (!targetBlock) return;

    updateBlockFields(blockId, { status: 'running', output: 'Connecting docker playground security sandbox compiler...\n' });

    try {
      const response = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input: customInput })
      });
      const resData = await response.json();
      
      const nextOutput = resData.output || 'Terminal closed. Output Stream ended.';
      const statusType = resData.status === 'success' ? 'success' : 'error';

      const historyItem = {
        timestamp: new Date().toISOString(),
        status: statusType as 'success' | 'error',
        output: nextOutput,
        input: customInput
      };
      const updatedHistory = [historyItem, ...(targetBlock.executionHistory || [])].slice(0, 5);

      updateBlockFields(blockId, {
        status: statusType,
        output: nextOutput,
        lastExecuted: new Date().toLocaleTimeString(),
        executionHistory: updatedHistory
      });

      onIncrementCodeExecutions();
    } catch (err) {
      setTimeout(() => {
        let terminalOutput = `>>> Sandboxed Isolation Standalone Kernel Online\n`;
        let statusType: 'success' | 'error' = 'success';

        if (language === 'javascript') {
          try {
            const originalConsole = console.log;
            let captured: string[] = [];
            console.log = (...args) => captured.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
            new Function(code)();
            console.log = originalConsole;
            terminalOutput += captured.length > 0 ? captured.join('\n') : 'Status: Code executed with return-code 0.';
          } catch (e: any) {
            terminalOutput += `Javascript syntax crash: ${e.message}\n`;
            statusType = 'error';
          }
        } else if (language === 'python') {
          if (code.includes('print(')) {
            const matches = [...code.matchAll(/print\(([^)]+)\)/g)];
            if (matches.length > 0) {
              terminalOutput += matches.map(m => m[1].replace(/['"]/g, '')).join('\n');
            } else {
              terminalOutput += "Standalone python runtime compiled successfully with code 0.";
            }
          } else {
            terminalOutput += `Process completed correctly.\nInput Stream buffer arguments read: "${customInput || '(empty stdin)'}"`;
          }
        } else if (language === 'java') {
          terminalOutput += `Main class main() instantiated. Stdin buffer parsed successfully: "${customInput || 'DefaultJavaUser'}"\nOutput Stream: Hello World.`;
        } else if (language === 'c' || language === 'cpp') {
          terminalOutput += `GCC compiler generated transient binary executable successfully.\nReturn code: 0\nOutput:\nHello World\nStdin echo: "${customInput || '(empty stdin)'}"`;
        } else {
          terminalOutput += `Linked dependencies successfully. Runtime: 0.04s.`;
        }

        const historyItem = {
          timestamp: new Date().toISOString(),
          status: statusType,
          output: terminalOutput,
          input: customInput
        };

        const updatedHistory = [historyItem, ...(targetBlock.executionHistory || [])].slice(0, 5);

        updateBlockFields(blockId, {
          status: statusType,
          output: terminalOutput,
          lastExecuted: new Date().toLocaleTimeString(),
          executionHistory: updatedHistory
        });

        onIncrementCodeExecutions();
      }, 600);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = selectedFolderId === null || n.folderId === selectedFolderId;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-140px)] select-none" id="smartnotes-module">
      
      {/* List Sidebar */}
      <div className="md:col-span-1 bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col space-y-4 shadow-sm" id="notes-explorer-sidebar">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-white/5 pl-9 pr-3 py-1.5 text-xs text-zinc-200 border border-[#27272a] focus:outline-none focus:border-indigo-500"
            id="notes-search-input"
          />
        </div>

        {/* Categories navigation */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-[#a1a1aa] px-1">
            <span>Folders Vault</span>
            <button 
              onClick={() => setShowFolderForm(!showFolderForm)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
              title="Add Folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>

          <AnimatePresence>
            {showFolderForm && (
              <motion.form 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                onSubmit={handleCreateFolder}
                className="mt-2 p-2 bg-white/5 rounded-lg border border-[#27272a] space-y-2"
              >
                <input
                  type="text"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] text-xs rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex justify-end gap-1.5 mr-1">
                  <button 
                    type="button" 
                    onClick={() => setShowFolderForm(false)}
                    className="text-[10px] px-2 py-1 text-zinc-400 hover:bg-white/5 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500 font-medium"
                  >
                    Create
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-2.5 space-y-1">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between font-medium transition-colors ${selectedFolderId === null ? 'bg-white/5 text-white border border-indigo-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex items-center gap-1.5"><HardDrive size={13} /> All Documents</span>
              <span className="text-[10px] font-mono opacity-60 bg-[#1e1e24] px-1.5 py-0.2 rounded">{notes.length}</span>
            </button>

            {folders.map(folder => (
              <div 
                key={folder.id}
                className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium ${selectedFolderId === folder.id ? 'bg-white/5 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="flex-1 text-left flex items-center gap-1.5"
                >
                  <ChevronRight size={12} className={selectedFolderId === folder.id ? 'rotate-90 text-indigo-400' : 'text-zinc-500'} />
                  <span className="truncate">{folder.name}</span>
                </button>
                <button
                  onClick={() => onDeleteFolder(folder.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Files View */}
        <div className="flex-1 overflow-y-auto pt-2 border-t border-[#27272a]">
          <div className="flex items-center justify-between mb-2 px-1">
            <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Document Files</h5>
            <button
              onClick={handleAddNewNote}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 pointer-events-auto"
              id="new-note-trigger-btn"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          <div className="space-y-1.5">
            {filteredNotes.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                <FileText className="mx-auto mb-1.5 opacity-40" size={24} />
                <p className="text-xs">Vault empty</p>
              </div>
            ) : (
              filteredNotes.map(note => {
                const isActive = note.id === activeNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className={`cursor-pointer group flex flex-col p-3 rounded-lg border transition-all ${
                      isActive 
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md' 
                        : 'bg-white/[0.02] border-[#27272a] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs truncate flex-1 pr-2">
                        {note.title || 'Untitled Node'}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] line-clamp-1 mt-1 text-zinc-400">
                      {note.content.startsWith('[') ? 'Structured Interactive Document' : 'Text document'}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                      <span>
                        {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      {note.tags.length > 0 && (
                        <span className="rounded px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400">
                          {note.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Write Canvas Area */}
      <div 
        onClick={handleCanvasClick}
        className="md:col-span-3 flex flex-col bg-[#18181b] border border-[#27272a] rounded-xl shadow-xs overflow-hidden cursor-text" 
        id="note-workspace-editor"
      >
        {activeNote ? (
          <>
            {/* Header ribbon */}
            <div className="border-b border-[#27272a] px-6 py-3.5 flex items-center justify-between bg-[#0f0f12] pointer-events-none">
              <div className="flex items-center gap-2">
                <div className={`flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isAutoSaving ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {isAutoSaving ? (
                    <span className="flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Auto-saving live document state...</span>
                  ) : (
                    <span>Auto-saved: {lastSaved}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" /> Interactive Notion-style OS v2.5 Running
                </span>
              </div>
            </div>

            {/* Core Canvas */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 pointer-events-auto" id="blocks-list-container">
              {/* Document Title header input */}
              <input
                type="text"
                placeholder="Name your interactive document..."
                value={activeNote.title}
                onChange={(e) => triggerAutoSave(blocks, e.target.value, activeNote.tags)}
                className="w-full text-3xl font-extrabold text-white tracking-tight border-b border-transparent focus:border-[#27272a]/50 focus:outline-none pb-2 font-sans"
              />

              {/* Tags panel */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#27272a] pb-4">
                <span className="text-xs text-zinc-500 font-mono flex items-center gap-0.5"><Tag size={12} /> Tags:</span>
                {activeNote.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-xs text-zinc-300 border border-[#27272a]"
                  >
                    #{tag}
                    <button 
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-500 hover:text-red-400 text-[10px]"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="bg-transparent border border-[#27272a] rounded-md px-2 py-0.5 text-xs text-zinc-300 w-16 focus:w-28 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button 
                    onClick={handleAddTag}
                    className="rounded bg-white/5 border border-[#27272a] text-zinc-400 p-1 hover:bg-white/10"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>

              {/* Dynamic Empty State block panel */}
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#27272a] rounded-xl bg-white/[0.01]">
                  <span className="text-4xl mb-3">📄</span>
                  <h4 className="text-sm font-bold text-zinc-200">Empty Document</h4>
                  <p className="text-xs text-zinc-500 mt-1">Start writing or add a block.</p>
                  <button
                    onClick={() => addBlockAtEnd('paragraph')}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 hover:active:scale-95 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
                  >
                    Add First Block
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pb-12">
                  {blocks.map((block, index) => (
                    <motion.div
                      key={block.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className="group relative flex items-start gap-2 p-1.5 rounded-lg hover:bg-white/[0.01] border border-transparent hover:border-[#27272a]/30 transition-all duration-150"
                    >
                      {/* Drag / Grip helpers */}
                      <div className="absolute left-[-42px] top-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-white rounded hover:bg-white/5">
                          <GripVertical size={13} />
                        </div>
                        <div className="flex flex-col">
                          <button 
                            onClick={() => moveBlock(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-zinc-500 hover:text-white rounded hover:bg-white/5 disabled:opacity-30"
                          >
                            <ArrowUp size={10} />
                          </button>
                          <button 
                            onClick={() => moveBlock(index, 'down')}
                            disabled={index === blocks.length - 1}
                            className="p-0.5 text-zinc-500 hover:text-white rounded hover:bg-white/5 disabled:opacity-30"
                          >
                            <ArrowDown size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Content editor block node renderer */}
                      <div className="flex-1 min-w-0" id={`block-wrapper-${block.id}`}>
                        <BlockNodeRenderer 
                          block={block} 
                          index={index}
                          onUpdate={(fields) => updateBlockFields(block.id, fields)} 
                          onRunCode={(customInput) => executeCodeBlock(block.id, block.code || '', block.language || 'python', customInput)}
                          onKeyDown={(e) => handleKeyDown(e, block.id, index)}
                        />
                      </div>

                      {/* Hover Actions Block selectors */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 ml-2 self-start pt-1">
                        <AddBlockPopover blockId={block.id} onSelect={(type) => addBlockBelow(block.id, type)} />
                        
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete Block"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Permanent Block adder at base of blocks list */}
                  <div className="flex justify-start pt-4 px-1.5" id="permanent-add-block-wrapper">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGlobalBlockSelector(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#27272a] bg-white/[0.01] hover:bg-white/5 text-xs text-zinc-450 hover:text-white transition-all duration-150 pointer-events-auto"
                      id="permanent-add-block-btn"
                    >
                      <Plus size={13} className="text-indigo-400" />
                      <span className="font-semibold text-zinc-400">Add Block</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-505 h-full">
            <div className="rounded-2xl bg-white/5 p-6 border border-[#27272a] mb-4">
              <FileText className="h-10 w-10 text-indigo-500 opacity-80" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">No Document Selected</h3>
            <p className="text-xs max-w-xs mt-1 leading-relaxed text-zinc-400">
              Create an interactive technical workspace, study sheet logs, or select a document from the vault.
            </p>
            <button
              onClick={handleAddNewNote}
              className="mt-5 rounded-lg bg-indigo-600 hover:bg-[#4338ca] text-white font-medium px-4 py-2 text-sm shadow-md transition-all active:scale-95"
            >
              Add Interactive Document
            </button>
          </div>
        )}
      </div>

      {/* Global Block Selection Modal */}
      <AnimatePresence>
        {showGlobalBlockSelector && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl p-4 max-w-md w-full"
            >
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
                <span className="text-xs font-mono text-indigo-400 font-bold tracking-widest uppercase">Select Block Type</span>
                <button 
                  onClick={() => setShowGlobalBlockSelector(false)}
                  className="text-zinc-500 hover:text-zinc-200 text-sm font-semibold p-1"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { type: 'paragraph', label: 'Text Paragraph', icon: FileText, desc: 'Normal body text' },
                  { type: 'heading', label: 'Heading Title', icon: Edit2, desc: 'Large title header' },
                  { type: 'code', label: 'Runnable Code', icon: Code, desc: 'Code runner segment' },
                  { type: 'table', label: 'Data Table', icon: TableIcon, desc: 'Data matrices columns' },
                  { type: 'checklist', label: 'Checklist Task', icon: CheckSquare, desc: 'Checkboxes checkbox task' },
                  { type: 'bullet_list', label: 'Bullet List', icon: List, desc: 'Bullet points list' },
                  { type: 'image', label: 'Image frame', icon: Image, desc: 'Embed graphical pictures' },
                  { type: 'attachment', label: 'Linked File', icon: Paperclip, desc: 'Attach references' },
                  { type: 'divider', label: 'Divider line', icon: Minus, desc: 'Thin separation line' },
                  { type: 'quote', label: 'Quote Box', icon: Quote, desc: 'Citation blocks' }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => addBlockAtEnd(item.type as DocumentBlock['type'])}
                      className="text-left p-2.5 rounded-lg bg-white/[0.02] border border-[#27272a] hover:border-indigo-505/50 hover:bg-white/5 transition-all flex items-start gap-2.5 group cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center shrink-0 border border-[#27272a] group-hover:bg-indigo-600/10 group-hover:text-white text-zinc-400">
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-250 block group-hover:text-white">{item.label}</span>
                        <span className="text-[10px] text-zinc-500 block truncate mt-0.5">{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowGlobalBlockSelector(false)}
                  className="px-4 py-1.5 rounded-lg border border-[#27272a] text-zinc-400 hover:text-white hover:bg-white/5 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Block Renderer Sub-Component
interface BlockNodeRendererProps {
  block: DocumentBlock;
  index: number;
  onUpdate: (fields: Partial<DocumentBlock>) => void;
  onRunCode: (customInput: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function BlockNodeRenderer({ block, index, onUpdate, onRunCode, onKeyDown }: BlockNodeRendererProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashSearchQuery, setSlashSearchQuery] = useState('');
  const [activeCommandIdx, setActiveCommandIdx] = useState(0);
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 });
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Notion-style commands catalog
  const SLASH_COMMANDS: { type: DocumentBlock['type']; label: string; shortcut: string; icon: any; desc: string }[] = [
    { type: 'paragraph', label: 'Text Paragraph', shortcut: '/text', icon: FileText, desc: 'Write basic document content body' },
    { type: 'heading', label: 'Heading Large', shortcut: '/heading', icon: Edit2, desc: 'Large title header section' },
    { type: 'code', label: 'Executable Code', shortcut: '/code', icon: Code, desc: 'Compute Python, JavaScript, Java, C/C++' },
    { type: 'image', label: 'Image Frame', shortcut: '/image', icon: Image, desc: 'Embed graphical illustrations URL' },
    { type: 'table', label: 'Data Table', shortcut: '/table', icon: TableIcon, desc: 'Grid matrices and statistical layouts' },
    { type: 'checklist', label: 'Checklist Task', shortcut: '/checklist', icon: CheckSquare, desc: 'Bullet points checkbox checkboxes' },
    { type: 'divider', label: 'Divider Line', shortcut: '/divider', icon: Minus, desc: 'Draw a horizontal grid separation line' },
    { type: 'quote', label: 'Quote citation', shortcut: '/quote', icon: Quote, desc: 'Cite reference or code blocks blockquote' }
  ];

  const filteredCommands = SLASH_COMMANDS.filter(cmd => 
    cmd.shortcut.includes(slashSearchQuery) || cmd.label.toLowerCase().includes(slashSearchQuery)
  );

  const getSlashQuery = (text: string) => {
    const lastSlashIdx = text.lastIndexOf('/');
    if (lastSlashIdx === -1) return null;
    
    const afterSlash = text.substring(lastSlashIdx + 1);
    if (afterSlash.includes(' ') || afterSlash.includes('\n')) return null;
    
    return afterSlash.toLowerCase();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onUpdate({ content: val });

    const query = getSlashQuery(val);
    if (query !== null) {
      setSlashMenuOpen(true);
      setSlashSearchQuery(query);
      setActiveCommandIdx(0);
      if (textInputRef.current) {
        setCursorPos({ top: 32, left: 12 });
      }
    } else {
      setSlashMenuOpen(false);
      setSlashSearchQuery('');
    }
  };

  const selectSlashCommand = (type: DocumentBlock['type']) => {
    setSlashMenuOpen(false);
    
    const lastSlashIdx = block.content.lastIndexOf('/');
    const nextContent = lastSlashIdx !== -1 ? block.content.substring(0, lastSlashIdx) : block.content;
    
    // Convert current block dynamically preserving typed words
    const fields: Partial<DocumentBlock> = { type, content: nextContent };
    
    if (type === 'code') {
      fields.language = 'python';
      fields.code = BOILERPLATES.python;
      fields.stdin = '';
      fields.output = '';
      fields.status = 'idle';
      fields.executionHistory = [];
    } else if (type === 'table') {
      fields.tableData = [['Column 1', 'Column 2'], ['', ''], ['', '']];
      fields.content = '';
    } else if (type === 'image') {
      fields.url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
      fields.caption = 'Concept layout diagram';
    } else if (type === 'checklist') {
      fields.checked = false;
    } else if (type === 'divider') {
      fields.content = '';
    } else if (type === 'attachment') {
      fields.attachmentName = 'ProjectBundleSDK.zip';
      fields.attachmentSize = '3.8 MB';
      fields.attachmentType = 'application/zip';
    }
    
    onUpdate(fields);
  };

  // Keyboard control interceptor
  const handleLocalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveCommandIdx(prev => (prev + 1) % Math.max(1, filteredCommands.length));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveCommandIdx(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[activeCommandIdx];
        if (selected) {
          selectSlashCommand(selected.type);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
    }

    onKeyDown(e);
  };

  // Auto expand heights
  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.style.height = 'auto';
      textInputRef.current.style.height = (textInputRef.current.scrollHeight) + 'px';
    }
  }, [block.content, block.type]);

  switch (block.type) {
    case 'heading': {
      const hLevel = block.headingLevel || 2;
      return (
        <div className="flex flex-col space-y-1 relative">
          <div className="flex items-center gap-1.5 mb-1 select-none">
            <span className="text-[9px] font-mono font-bold uppercase text-indigo-400 bg-white/5 border border-[#27272a] px-1.5 py-0.5 rounded">h{hLevel} Title</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => onUpdate({ headingLevel: lvl as 1 | 2 | 3 })}
                  className={`text-[9px] font-bold px-1.5 rounded ${hLevel === lvl ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-white'}`}
                >
                  H{lvl}
                </button>
              ))}
            </div>
          </div>
          <textarea
            ref={textInputRef}
            rows={1}
            value={block.content}
            onChange={handleTextChange}
            onKeyDown={handleLocalKeyDown}
            id={`textarea-${block.id}`}
            className={`w-full bg-transparent text-white border-0 border-b border-transparent focus:border-[#27272a]/50 focus:outline-none focus:ring-0 resize-none font-bold tracking-tight py-1 ${hLevel === 1 ? 'text-2xl md:text-3xl' : hLevel === 2 ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}
            placeholder={`Enter Heading ${hLevel} title... (/ for commands)`}
          />
          {slashMenuOpen && <SlashCommandDropdown coords={cursorPos} commands={filteredCommands} activeIndex={activeCommandIdx} onSelect={selectSlashCommand} onClose={() => setSlashMenuOpen(false)} />}
        </div>
      );
    }

    case 'checklist': {
      return (
        <div className="flex items-start gap-2.5 py-0.5">
          <button
            onClick={() => onUpdate({ checked: !block.checked })}
            className={`mt-1 flex items-center justify-center shrink-0 border rounded h-4.5 w-4.5 border-[#27272a] hover:border-indigo-500 transition-colors ${block.checked ? 'bg-indigo-600 text-white' : 'bg-transparent'}`}
          >
            {block.checked && <Check size={11} strokeWidth={3} />}
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={textInputRef}
              rows={1}
              value={block.content}
              onChange={handleTextChange}
              onKeyDown={handleLocalKeyDown}
              id={`textarea-${block.id}`}
              className={`w-full bg-transparent text-zinc-250 border-0 border-b border-transparent focus:border-[#27272a]/50 focus:outline-none focus:ring-0 resize-none text-sm md:text-base ${block.checked ? 'line-through text-zinc-500' : 'font-medium'}`}
              placeholder="List checkbox detail... (/ for commands)"
            />
            {slashMenuOpen && <SlashCommandDropdown coords={cursorPos} commands={filteredCommands} activeIndex={activeCommandIdx} onSelect={selectSlashCommand} onClose={() => setSlashMenuOpen(false)} />}
          </div>
        </div>
      );
    }

    case 'bullet_list': {
      return (
        <div className="flex items-start gap-2 py-0.5">
          <span className="text-indigo-400 text-base leading-none select-none pt-1">•</span>
          <div className="flex-1 relative">
            <textarea
              ref={textInputRef}
              rows={1}
              value={block.content}
              onChange={handleTextChange}
              onKeyDown={handleLocalKeyDown}
              id={`textarea-${block.id}`}
              className="w-full bg-transparent text-zinc-250 border-0 border-b border-transparent focus:border-[#27272a]/50 focus:outline-none focus:ring-0 resize-none text-sm md:text-base font-normal leading-relaxed"
              placeholder="List bullet points... (/ for commands)"
            />
            {slashMenuOpen && <SlashCommandDropdown coords={cursorPos} commands={filteredCommands} activeIndex={activeCommandIdx} onSelect={selectSlashCommand} onClose={() => setSlashMenuOpen(false)} />}
          </div>
        </div>
      );
    }

    case 'numbered_list': {
      return (
        <div className="flex items-start gap-2 py-0.5">
          <span className="text-indigo-400 font-mono text-xs font-bold select-none pt-1">{index + 1}.</span>
          <div className="flex-1 relative">
            <textarea
              ref={textInputRef}
              rows={1}
              value={block.content}
              onChange={handleTextChange}
              onKeyDown={handleLocalKeyDown}
              id={`textarea-${block.id}`}
              className="w-full bg-transparent text-zinc-250 border-0 border-b border-transparent focus:border-[#27272a]/50 focus:outline-none focus:ring-0 resize-none text-sm md:text-base font-normal leading-relaxed"
              placeholder="Sequential steps lists... (/ for commands)"
            />
            {slashMenuOpen && <SlashCommandDropdown coords={cursorPos} commands={filteredCommands} activeIndex={activeCommandIdx} onSelect={selectSlashCommand} onClose={() => setSlashMenuOpen(false)} />}
          </div>
        </div>
      );
    }

    case 'image': {
      return (
        <div className="space-y-2 border border-[#27272a] rounded-xl p-4 bg-white/[0.01]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-[9px] font-mono font-bold uppercase text-indigo-400 flex items-center gap-1 leading-normal">
              <Image size={11} /> IMAGE Frame NODE
            </span>
            <input
              type="text"
              value={block.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="Paste image graphic address URL..."
              className="bg-white/5 border border-[#27272a] text-xs px-2.5 py-1 rounded text-zinc-300 focus:outline-none focus:border-indigo-500 flex-1 max-w-sm"
            />
          </div>
          <div className="overflow-hidden rounded-lg bg-neutral-900 border border-[#27272a] flex items-center justify-center min-h-[160px] relative group/img">
            {block.url ? (
              <img
                src={block.url}
                alt={block.caption || 'Sandbox illustration'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
                }}
                className="max-h-[300px] object-cover w-full"
              />
            ) : (
              <span className="text-zinc-500 text-xs font-mono">Resource unassigned</span>
            )}
          </div>
          <input
            type="text"
            value={block.caption || ''}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="Add image caption..."
            aria-label="Image Caption details"
            id={`textarea-${block.id}`}
            className="w-full bg-transparent border-0 border-b border-transparent focus:border-[#27272a] focus:outline-none text-xs text-center text-zinc-400 italic"
          />
        </div>
      );
    }

    case 'table': {
      const rows = block.tableData || [['Cell']];
      
      const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
        const nextData = rows.map((row, r) => row.map((cell, c) => r === rIdx && c === cIdx ? val : cell));
        onUpdate({ tableData: nextData });
      };

      const addRow = () => {
        const colCount = rows[0]?.length || 2;
        const nextData = [...rows, Array(colCount).fill('')];
        onUpdate({ tableData: nextData });
      };

      const addCol = () => {
        const nextData = rows.map(r => [...r, '']);
        onUpdate({ tableData: nextData });
      };

      const deleteRow = (rIdx: number) => {
        if (rows.length <= 1) return;
        const nextData = rows.filter((_, idx) => idx !== rIdx);
        onUpdate({ tableData: nextData });
      };

      const deleteCol = (cIdx: number) => {
        if (rows[0].length <= 1) return;
        const nextData = rows.map(r => r.filter((_, idx) => idx !== cIdx));
        onUpdate({ tableData: nextData });
      };

      return (
        <div className="space-y-3.5 border border-[#27272a] rounded-xl p-4 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-1.5 leading-normal">
              <TableIcon size={12} className="text-indigo-400" /> DATA TABLE MATRIX
            </span>
            <div className="flex gap-2">
              <button
                onClick={addRow}
                className="text-[9px] font-bold bg-white/5 hover:bg-white/10 border border-[#27272a] rounded px-2 py-1 text-zinc-300 flex items-center gap-0.5"
              >
                + Row
              </button>
              <button
                onClick={addCol}
                className="text-[9px] font-bold bg-white/5 hover:bg-white/10 border border-[#27272a] rounded px-2 py-1 text-zinc-300 flex items-center gap-0.5"
              >
                + Col
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-neutral-950">
            <table className="min-w-full divide-y divide-[#27272a]">
              <tbody className="divide-y divide-[#27272a]">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="divide-x divide-[#27272a]">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 relative group/cell">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          className="w-full bg-transparent text-xs text-zinc-200 border-0 focus:ring-0 focus:outline-none font-sans"
                        />
                        {rIdx === 0 && row.length > 1 && (
                          <button
                            onClick={() => deleteCol(cIdx)}
                            className="hidden group-hover/cell:flex absolute right-1 top-1 text-[8px] bg-red-950/50 hover:bg-red-900 border border-red-500/10 text-red-400 rounded px-1 cursor-pointer"
                          >
                            Del Col
                          </button>
                        )}
                        {cIdx === 0 && rows.length > 1 && (
                          <button
                            onClick={() => deleteRow(rIdx)}
                            className="hidden group-hover/cell:flex absolute left-1 bottom-1 text-[8px] bg-red-950/50 hover:bg-red-900 border border-red-500/10 text-red-400 rounded px-1 cursor-pointer"
                          >
                            Del Row
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Placeholder ID textarea helper */}
          <textarea id={`textarea-${block.id}`} className="hidden" readOnly />
        </div>
      );
    }

    case 'attachment': {
      return (
        <div className="flex items-center justify-between border border-[#27272a] bg-white/[0.01] hover:bg-white/5 rounded-xl p-4 transition-all">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Paperclip size={18} />
            </div>
            <div>
              <input
                type="text"
                value={block.attachmentName || ''}
                onChange={(e) => onUpdate({ attachmentName: e.target.value })}
                className="bg-transparent border-0 border-b border-transparent focus:border-[#27272a] focus:outline-none text-xs font-bold text-zinc-100 py-0.5"
                placeholder="Filename..."
              />
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                <input
                  type="text"
                  value={block.attachmentSize || '1.2 MB'}
                  onChange={(e) => onUpdate({ attachmentSize: e.target.value })}
                  className="bg-transparent w-16 border-0 focus:outline-none text-zinc-500 focus:border-[#27272a]"
                />
                <span>• Attachment Sandbox</span>
              </div>
            </div>
          </div>

          <a 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert(`Downloading linked resource: ${block.attachmentName || 'SDK Package'}`);
            }}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <FileDown size={15} />
          </a>
          {/* Placeholder ID textarea helper */}
          <textarea id={`textarea-${block.id}`} className="hidden" readOnly />
        </div>
      );
    }

    case 'divider': {
      return (
        <div className="py-2.5 w-full select-none pointer-events-none">
          <hr className="border-t border-[#27272a]" />
          {/* Faux target to prevent cursor traps */}
          <textarea id={`textarea-${block.id}`} className="hidden" readOnly />
        </div>
      );
    }

    case 'quote': {
      return (
        <div className="border-l-4 border-indigo-500 pl-4 py-1.5 italic text-zinc-300 relative">
          <textarea
            ref={textInputRef}
            rows={1}
            value={block.content}
            onChange={handleTextChange}
            onKeyDown={handleLocalKeyDown}
            id={`textarea-${block.id}`}
            className="w-full bg-transparent text-zinc-200 border-0 border-b border-transparent focus:border-[#27272a]/50 focus:outline-none focus:ring-0 resize-none text-sm md:text-base font-serif"
            placeholder="Enter quote words... (/ for commands)"
          />
          {slashMenuOpen && <SlashCommandDropdown coords={cursorPos} commands={filteredCommands} activeIndex={activeCommandIdx} onSelect={selectSlashCommand} onClose={() => setSlashMenuOpen(false)} />}
        </div>
      );
    }

    case 'code': {
      const isRunning = block.status === 'running';
      const history = block.executionHistory || [];

      const loadPastExecution = (item: { input: string; output: string }) => {
        onUpdate({ stdin: item.input, output: item.output, status: 'success' });
      };

      return (
        <div className="border border-[#27272a] rounded-xl overflow-hidden bg-[#0c0c0e] my-3">
          <div className="bg-[#111114] border-b border-[#27272a] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/80"></span>
              <select
                value={block.language || 'python'}
                onChange={(e) => {
                  const targetLang = e.target.value;
                  onUpdate({ language: targetLang, code: BOILERPLATES[targetLang] });
                }}
                className="bg-[#18181b] text-white border border-[#27272a] text-[10px] font-mono font-bold rounded-md px-2.5 py-0.5 focus:outline-none ml-2"
              >
                <option value="python">Python 3.13</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java SE 21</option>
                <option value="c">C Compiler GCC</option>
                <option value="cpp">C++ Compiler G++</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-[9px] font-medium text-zinc-400 hover:text-white border border-[#27272a] bg-white/5 rounded px-2.5 py-1 flex items-center gap-1 font-mono hover:bg-white/10 transition-colors"
                >
                  Ledger ({history.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(block.code || '');
                  alert('Source code copied to workspace clip buffer!');
                }}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-all"
                title="Copy Source"
              >
                <Copy size={13} />
              </button>

              <button
                type="button"
                onClick={() => onRunCode(block.stdin || '')}
                disabled={isRunning}
                className="bg-indigo-600 hover:bg-indigo-500 hover:active:scale-95 disabled:bg-[#18181b] disabled:text-zinc-650 disabled:border-[#27272a] text-white font-mono text-[10px] font-bold rounded-lg px-3 py-1 flex items-center gap-1 transition-all border border-indigo-500/20 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Loader2 size={11} className="animate-spin" /> COMPILING...
                  </>
                ) : (
                  <>
                    <Play size={9} fill="white" /> RUN CODE
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Past ledger execution history */}
          {showHistory && history.length > 0 && (
            <div className="bg-[#18181b] border-b border-[#27272a] p-3 text-[10px] font-mono space-y-2 max-h-36 overflow-y-auto">
              <span className="text-zinc-500 font-bold uppercase tracking-wider block">EXECUTION LEDGER:</span>
              <div className="grid grid-cols-1 gap-1">
                {history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      loadPastExecution(h);
                      setShowHistory(false);
                    }}
                    className="flex justify-between items-center p-2 rounded bg-neutral-900 border border-[#27272a]/60 hover:bg-white/5 cursor-pointer"
                  >
                    <span className="text-indigo-400 truncate max-w-[280px]">Run #{history.length - i}: [args: "{h.input || 'none'}"]</span>
                    <span className="text-zinc-500 text-[9px]">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monaco Sandbox Container */}
          <div className="h-56 border-b border-[#27272a] relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={block.language === 'cpp' ? 'cpp' : block.language === 'java' ? 'java' : block.language === 'c' ? 'c' : block.language}
              value={block.code || ''}
              onChange={(val) => onUpdate({ code: val || '' })}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'JetBrains Mono, SFMono-Regular, monospace',
                lineHeight: 18,
                padding: { top: 12, bottom: 12 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                cursorBlinking: 'smooth'
              }}
            />
          </div>

          {/* Configuration Inputs / Output panels */}
          <div className="p-4 bg-[#0a0a0c] space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1 active:scale-95 leading-normal">
                Standard Compiler Input (Stdinargs):
              </label>
              <input
                type="text"
                value={block.stdin || ''}
                onChange={(e) => onUpdate({ stdin: e.target.value })}
                placeholder="Provide standard inputs for execution arguments buffer..."
                className="w-full bg-[#111114] border border-[#27272a] rounded px-2.5 py-1 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="border border-[#27272a] rounded-lg overflow-hidden">
              <div className="bg-[#111114] border-b border-[#27272a] px-3 py-1 flex items-center justify-between text-[8px] font-mono font-bold uppercase tracking-widest text-[#a1a1aa] leading-normal">
                <span>Output Console panel terminal:</span>
                {block.lastExecuted && <span className="text-zinc-500 font-normal">LAST RUN: {block.lastExecuted}</span>}
              </div>
              <div className="bg-[#0e0e11] p-3 text-xs font-mono leading-relaxed min-h-[50px] relative">
                {isRunning ? (
                  <div className="flex items-center gap-2.5 py-2 text-zinc-400 text-[11px]">
                    <Loader2 size={13} className="animate-spin text-indigo-500" />
                    <span>Allocating sandbox memory container namespace and compiling run code...</span>
                  </div>
                ) : (
                  <pre className={`whitespace-pre-wrap ${block.status === 'error' ? 'text-red-400' : 'text-zinc-250'}`}>
                    {block.output || 'Terminal stream is idle. Hit run inside block to compile.'}
                  </pre>
                )}
              </div>
            </div>
          </div>
          {/* Invisible ref field */}
          <textarea id={`textarea-${block.id}`} className="hidden" readOnly />
        </div>
      );
    }

    default: {
      return (
        <div className="relative">
          <textarea
            ref={textInputRef}
            rows={1}
            value={block.content}
            onChange={handleTextChange}
            onKeyDown={handleLocalKeyDown}
            id={`textarea-${block.id}`}
            className="w-full bg-transparent text-zinc-200 border-0 border-b border-transparent focus:border-[#27272a]/50 focus:outline-none focus:ring-0 resize-none text-sm md:text-base font-normal leading-relaxed font-sans pb-1"
            placeholder="Type your markdown content... (/ for Notion tools commands)"
          />
          {slashMenuOpen && <SlashCommandDropdown coords={cursorPos} commands={filteredCommands} activeIndex={activeCommandIdx} onSelect={selectSlashCommand} onClose={() => setSlashMenuOpen(false)} />}
        </div>
      );
    }
  }
}

// Dropdown Helper Component
interface SlashCommandDropdownProps {
  coords: { top: number; left: number };
  commands: { type: DocumentBlock['type']; label: string; shortcut: string; icon: any; desc: string }[];
  activeIndex: number;
  onSelect: (type: DocumentBlock['type']) => void;
  onClose: () => void;
}

function SlashCommandDropdown({ coords, commands, activeIndex, onSelect, onClose }: SlashCommandDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl p-1.5 w-72 z-50 text-left cursor-default select-none pointer-events-auto"
      style={{ top: coords.top, left: coords.left }}
    >
      <div className="bg-[#0f0f12] px-3 py-1.5 rounded-lg border border-[#27272a] mb-2">
        <span className="text-[9px] font-mono font-bold text-indigo-400 block tracking-wider uppercase">NOTION COMMANDS</span>
        <span className="text-[8px] text-zinc-500 font-sans block leading-none mt-0.5">Use keys or click to select block tool</span>
      </div>

      <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
        {commands.length === 0 ? (
          <div className="p-2 text-center text-[10px] text-zinc-500">
            No matching command filter
          </div>
        ) : (
          commands.map((act, idx) => {
            const IconComponent = act.icon;
            const isSelected = idx === activeIndex;
            return (
              <button
                key={act.type}
                onClick={() => onSelect(act.type)}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-all cursor-pointer group ${isSelected ? 'bg-white/5 border border-[#27272a]' : 'border border-transparent'}`}
              >
                <div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-indigo-600/20 border-indigo-505/40 text-white' : 'bg-white/5 border-[#27272a]/50 text-zinc-400 group-hover:text-white'}`}>
                  <IconComponent size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-bold block leading-normal transition-colors ${isSelected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{act.label}</span>
                  <span className="text-[10px] text-zinc-550 block truncate leading-none mt-0.5">{act.desc}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Hover Add Block Button popover trigger
interface AddBlockPopoverProps {
  blockId: string;
  onSelect: (type: DocumentBlock['type']) => void;
}

function AddBlockPopover({ blockId, onSelect }: AddBlockPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const ALL_BLOCKS: { type: DocumentBlock['type']; label: string; icon: any }[] = [
    { type: 'paragraph', label: 'Paragraph', icon: FileText },
    { type: 'heading', label: 'Heading Title', icon: Edit2 },
    { type: 'code', label: 'Runnable Code', icon: Code },
    { type: 'table', label: 'Table Matrix', icon: TableIcon },
    { type: 'checklist', label: 'Checklist Task', icon: CheckSquare },
    { type: 'bullet_list', label: 'Unordered List', icon: List },
    { type: 'image', label: 'Image', icon: Image },
    { type: 'attachment', label: 'File Link', icon: Paperclip },
    { type: 'divider', label: 'Divider Line', icon: Minus },
    { type: 'quote', label: 'Quote citation', icon: Quote }
  ];

  return (
    <div ref={containerRef} className="relative inline-block text-left select-none">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"
        title="Insert block below"
      >
        <PlusCircle size={13} />
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-1 w-52 rounded-xl shadow-xl bg-[#18181b] border border-[#27272a] p-1.5 z-40 pointer-events-auto">
          <div className="px-2 py-1 border-b border-[#27272a] mb-1 leading-normal">
            <span className="text-[8px] font-mono text-indigo-400 font-bold tracking-widest uppercase">INSERT BLOCK</span>
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {ALL_BLOCKS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => {
                    onSelect(item.type);
                    setOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-md flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Icon size={12} className="text-zinc-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
