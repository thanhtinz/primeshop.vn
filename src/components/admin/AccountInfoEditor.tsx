import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface AccountInfoEditorProps {
  value: Record<string, string>;
  onChange: (info: Record<string, string>) => void;
}

export function AccountInfoEditor({ value, onChange }: AccountInfoEditorProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newKey.trim()) return;
    onChange({ ...value, [newKey.trim()]: newValue.trim() });
    setNewKey('');
    setNewValue('');
  };

  const handleRemove = (key: string) => {
    const newInfo = { ...value };
    delete newInfo[key];
    onChange(newInfo);
  };

  return (
    <div className="space-y-3">
      <Label>Thông tin tài khoản (hiển thị trên card)</Label>
      <div className="space-y-2">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <Input value={key} disabled className="flex-1" />
            <Input 
              value={val} 
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              className="flex-1" 
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(key)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input 
          placeholder="Tên trường (VD: Tướng)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1"
        />
        <Input 
          placeholder="Giá trị (VD: 50)"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}