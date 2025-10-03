import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

interface Group {
  id: string;
  name: string;
  responsible: string;
  primaryLeader: string;
  secondaryLeader: string;
  shifts: string[];
  status: 'active' | 'inactive';
}

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Partial<Group>;
  onSave: (group: Partial<Group>) => void;
  isLoading: boolean;
  isEditing: boolean;
}

// Define default times for each shift
const shiftDefaults = {
  'hayaban': { startTime: '08:00', endTime: '17:00', breakTime: '12:00', breakDuration: '1h' },
  'osoban': { startTime: '17:00', endTime: '02:00', breakTime: '21:00', breakDuration: '1h' },
  'hirokin': { startTime: '22:00', endTime: '07:00', breakTime: '02:00', breakDuration: '1h' }
};

const GroupModal = ({ 
  isOpen, 
  onClose, 
  group, 
  onSave, 
  isLoading, 
  isEditing 
}: GroupModalProps) => {
  const [localGroup, setLocalGroup] = React.useState<Partial<Group>>({
    name: '',
    responsible: '',
    primaryLeader: '',
    secondaryLeader: '',
    shifts: [],
    status: 'active'
  });

  // Reset the form when the dialog opens or the group changes
  React.useEffect(() => {
    if (group && isOpen) {
      // Create a deep copy to avoid reference issues
      const groupCopy = JSON.parse(JSON.stringify(group));
      
      // Ensure status is the correct type
      if (groupCopy.status && typeof groupCopy.status === 'string') {
        groupCopy.status = groupCopy.status === 'active' ? 'active' : 'inactive';
      }
      
      // Ensure shifts is an array of strings
      if (!groupCopy.shifts) {
        groupCopy.shifts = [];
      } else if (Array.isArray(groupCopy.shifts) && groupCopy.shifts.length > 0 && typeof groupCopy.shifts[0] !== 'string') {
        // Convert complex shift objects to strings if needed
        groupCopy.shifts = groupCopy.shifts.map((s: any) => s.name || s);
      }
      
      setLocalGroup(groupCopy);
    }
  }, [group, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace('edit-', '');
    
    setLocalGroup(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleShiftsChange = (value: string) => {
    // Split the comma-separated shift names
    const shiftNames = value.split(',').filter(Boolean);
    
    setLocalGroup(prev => ({
      ...prev,
      shifts: shiftNames
    }));
  };

  const handleSave = () => {
    if (!localGroup.name || !localGroup.responsible || !localGroup.primaryLeader) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    
    // Make sure status is strongly typed before saving
    const groupToSave = {
      ...localGroup,
      status: (localGroup.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive'
    };
    
    onSave(groupToSave);
  };

  // Reset form when closing dialog
  React.useEffect(() => {
    if (!isOpen) {
      setLocalGroup({
        name: '',
        responsible: '',
        primaryLeader: '',
        secondaryLeader: '',
        shifts: [],
        status: 'active'
      });
    }
  }, [isOpen]);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Editar Grupo' : 'Novo Grupo'}
        </DialogTitle>
        <DialogDescription>
          {isEditing 
            ? 'Edite os dados do grupo' 
            : 'Preencha os dados para criar um novo grupo'
          }
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Grupo</Label>
          <Input
            id={isEditing ? "edit-name" : "name"}
            value={localGroup.name || ''}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsible">Responsável</Label>
          <Input
            id={isEditing ? "edit-responsible" : "responsible"}
            value={localGroup.responsible || ''}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryLeader">Líder 1</Label>
          <Input
            id={isEditing ? "edit-primaryLeader" : "primaryLeader"}
            value={localGroup.primaryLeader || ''}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondaryLeader">Líder 2</Label>
          <Input
            id={isEditing ? "edit-secondaryLeader" : "secondaryLeader"}
            value={localGroup.secondaryLeader || ''}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label>Turnos Disponíveis</Label>
          <Select
            value={Array.isArray(localGroup.shifts) ? localGroup.shifts.join(',') : ''}
            onValueChange={handleShiftsChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione os turnos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hayaban">Hayaban</SelectItem>
              <SelectItem value="osoban">Osoban</SelectItem>
              <SelectItem value="hirokin">Hirokin</SelectItem>
              <SelectItem value="hayaban,osoban">Hayaban, Osoban</SelectItem>
              <SelectItem value="hayaban,hirokin">Hayaban, Hirokin</SelectItem>
              <SelectItem value="osoban,hirokin">Osoban, Hirokin</SelectItem>
              <SelectItem value="hayaban,osoban,hirokin">Todos os turnos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading 
            ? (isEditing ? 'Salvando...' : 'Criando...') 
            : (isEditing ? 'Salvar Alterações' : 'Criar Grupo')
          }
        </Button>
      </div>
    </DialogContent>
  );
};

export default GroupModal;
