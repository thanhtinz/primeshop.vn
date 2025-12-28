import { useEditor, EditorContent, Node, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  List, 
  ListOrdered, 
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Minus,
  Table as TableIcon,
  Youtube as YoutubeIcon,
  Music,
  MousePointer2,
  Trash2,
  Plus,
  Palette,
  Highlighter
} from 'lucide-react';
import { Toggle } from './toggle';
import { Separator } from './separator';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

// Custom YouTube Extension
const Youtube = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      width: { default: '100%' },
      height: { default: 'auto' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-youtube-video]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes.src?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return ['div', { 'data-youtube-video': '', class: 'relative w-full aspect-video my-4' }, 
      ['iframe', { 
        src: videoId ? `https://www.youtube.com/embed/${videoId}` : HTMLAttributes.src,
        class: 'w-full h-full rounded-lg',
        frameborder: '0',
        allowfullscreen: 'true',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
      }]
    ];
  },
});

// Custom Audio Extension
const Audio = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'audio' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['audio', mergeAttributes(HTMLAttributes, { controls: true, class: 'w-full my-2' })];
  },
});

// Custom Button Extension
const CustomButton = Node.create({
  name: 'customButton',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      href: { default: '#' },
      text: { default: 'Button' },
      variant: { default: 'primary' },
    };
  },
  parseHTML() {
    return [{ tag: 'a[data-type="button"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const variantClasses: Record<string, string> = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    };
    const className = `inline-block px-4 py-2 rounded-md font-medium text-sm no-underline ${variantClasses[HTMLAttributes.variant as string] || variantClasses.primary}`;
    return ['a', mergeAttributes(HTMLAttributes, { 
      'data-type': 'button',
      class: className,
      target: '_blank',
      rel: 'noopener noreferrer'
    }), HTMLAttributes.text];
  },
});

// Predefined colors for text and highlight
const textColors = [
  { name: 'Đen', color: '#000000' },
  { name: 'Trắng', color: '#ffffff' },
  { name: 'Đỏ', color: '#ef4444' },
  { name: 'Cam', color: '#f97316' },
  { name: 'Vàng', color: '#eab308' },
  { name: 'Xanh lá', color: '#22c55e' },
  { name: 'Xanh dương', color: '#3b82f6' },
  { name: 'Tím', color: '#8b5cf6' },
  { name: 'Hồng', color: '#ec4899' },
  { name: 'Xám', color: '#6b7280' },
];

const highlightColors = [
  { name: 'Vàng', color: '#fef08a' },
  { name: 'Xanh lá', color: '#bbf7d0' },
  { name: 'Xanh dương', color: '#bfdbfe' },
  { name: 'Tím', color: '#ddd6fe' },
  { name: 'Hồng', color: '#fbcfe8' },
  { name: 'Cam', color: '#fed7aa' },
  { name: 'Đỏ', color: '#fecaca' },
  { name: 'Xám', color: '#e5e7eb' },
];

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = ({ content, onChange, placeholder, className }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border w-full my-4',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 bg-muted font-bold',
        },
      }),
      Youtube,
      Audio,
      CustomButton,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = prompt('Nhập URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = prompt('Nhập URL hình ảnh:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addYoutube = () => {
    const url = prompt('Nhập URL video YouTube:');
    if (url) {
      editor.chain().focus().insertContent({
        type: 'youtube',
        attrs: { src: url },
      }).run();
    }
  };

  const addAudio = () => {
    const url = prompt('Nhập URL âm thanh (mp3, wav,...):');
    if (url) {
      editor.chain().focus().insertContent({
        type: 'audio',
        attrs: { src: url },
      }).run();
    }
  };

  const addButton = () => {
    const text = prompt('Nhập text cho button:', 'Xem thêm');
    if (!text) return;
    const href = prompt('Nhập URL liên kết:', 'https://');
    if (!href) return;
    const variant = prompt('Chọn kiểu (primary/secondary/outline):', 'primary');
    
    editor.chain().focus().insertContent({
      type: 'customButton',
      attrs: { text, href, variant: variant || 'primary' },
    }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const setHighlightColor = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  return (
    <div className={cn('border border-input rounded-md bg-background', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-input bg-muted/30">
        {/* Undo/Redo */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('code')}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Màu chữ">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-5 gap-1">
              {textColors.map((c) => (
                <button
                  key={c.color}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.color }}
                  onClick={() => setTextColor(c.color)}
                  title={c.name}
                />
              ))}
            </div>
            <button
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              Xóa màu chữ
            </button>
          </PopoverContent>
        </Popover>

        {/* Highlight Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2" title="Tô sáng">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {highlightColors.map((c) => (
                <button
                  key={c.color}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.color }}
                  onClick={() => setHighlightColor(c.color)}
                  title={c.name}
                />
              ))}
            </div>
            <button
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              Xóa highlight
            </button>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'left' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'center' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: 'right' })}
          onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link & Image */}
        <Toggle
          size="sm"
          pressed={editor.isActive('link')}
          onPressedChange={addLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={addImage}
        >
          <ImageIcon className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Table Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <TableIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={insertTable}>
              <Plus className="h-4 w-4 mr-2" />
              Chèn bảng 3x3
            </DropdownMenuItem>
            {editor.isActive('table') && (
              <>
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm cột
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm hàng
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa cột
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa hàng
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
                  Gộp ô
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
                  Tách ô
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>
                  <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                  Xóa bảng
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* YouTube */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={addYoutube}
          title="Chèn video YouTube"
        >
          <YoutubeIcon className="h-4 w-4" />
        </Toggle>

        {/* Audio */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={addAudio}
          title="Chèn âm thanh"
        >
          <Music className="h-4 w-4" />
        </Toggle>

        {/* Button */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={addButton}
          title="Chèn nút bấm"
        >
          <MousePointer2 className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Horizontal Rule */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Toggle>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-2 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-2 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-muted-foreground/30 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_hr]:border-t [&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-4 [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:my-4 [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:p-2 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:bg-muted [&_.ProseMirror_th]:font-bold [&_.ProseMirror_iframe]:w-full [&_.ProseMirror_iframe]:aspect-video [&_.ProseMirror_iframe]:rounded-lg [&_.ProseMirror_iframe]:my-4 [&_.ProseMirror_mark]:px-1 [&_.ProseMirror_mark]:rounded"
      />
    </div>
  );
};

export default RichTextEditor;
