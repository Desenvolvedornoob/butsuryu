
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  breakDuration: string;
  status: 'active' | 'inactive';
}

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Partial<Shift>;
  onSave: (shift: Partial<Shift>) => void;
  isLoading: boolean;
  isEditing: boolean;
}

const ShiftModal = ({ 
  isOpen, 
  onClose, 
  shift, 
  onSave, 
  isLoading, 
  isEditing 
}: ShiftModalProps) => {
  const [localShift, setLocalShift] = React.useState<Partial<Shift>>({
    name: '',
    startTime: '',
    endTime: '',
    breakTime: '',
    breakDuration: '',
    status: 'active'
  });
  
  // Track if we've submitted the form to prevent double-clicks
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const initialShiftName = React.useRef('');

  // Reset the form when the dialog opens or the shift changes
  React.useEffect(() => {
    if (shift && isOpen) {
      // Create a deep copy to avoid reference issues
      const shiftCopy = JSON.parse(JSON.stringify(shift));
      
      // Ensure status is the correct type
      if (shiftCopy.status && typeof shiftCopy.status === 'string') {
        shiftCopy.status = shiftCopy.status === 'active' ? 'active' : 'inactive';
      }
      
      console.log("Recebendo shift para edição:", shiftCopy);
      setLocalShift(shiftCopy);
      initialShiftName.current = shiftCopy.name || '';
    }
  }, [shift, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    console.log(`Campo alterado: ${id}, Valor: ${value}`);
    
    setLocalShift(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleShiftTypeChange = (value: string) => {
    // Update shift type and set default values for the selected type
    const shiftDefaults = {
      'hayaban': { startTime: '08:00', endTime: '17:00', breakTime: '12:00', breakDuration: '1h' },
      'osoban': { startTime: '17:00', endTime: '02:00', breakTime: '21:00', breakDuration: '1h' },
      'hirokin': { startTime: '22:00', endTime: '07:00', breakTime: '02:00', breakDuration: '1h' }
    };
    
    const defaults = shiftDefaults[value as keyof typeof shiftDefaults] || 
                    { startTime: '', endTime: '', breakTime: '', breakDuration: '' };
    
    setLocalShift(prev => ({
      ...prev,
      name: value,
      ...defaults
    }));
    
    console.log("Tipo de turno alterado para:", value, "com valores padrão:", defaults);
  };

  const handleSave = () => {
    if (isSubmitting) return;
    
    if (!localShift.name) {
      toast.error("Selecione um tipo de turno.");
      return;
    }

    if (!localShift.startTime) {
      toast.error("Informe o horário de início.");
      return;
    }

    if (!localShift.endTime) {
      toast.error("Informe o horário de término.");
      return;
    }

    if (!localShift.breakTime) {
      toast.error("Informe o horário do intervalo.");
      return;
    }

    if (!localShift.breakDuration) {
      toast.error("Informe a duração do intervalo.");
      return;
    }
    
    // Set submitting state to prevent double-click
    setIsSubmitting(true);
    
    // Make sure we're saving the ID if we're editing
    const shiftToSave = {
      ...localShift,
      id: shift.id, // Ensure the original ID is maintained
      status: (localShift.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
      originalName: isEditing ? initialShiftName.current : undefined // Pass the original name for edit operations
    };
    
    console.log("Dados enviados para salvamento:", shiftToSave);
    onSave(shiftToSave);
  };

  // Reset form when closing dialog
  React.useEffect(() => {
    if (!isOpen) {
      setLocalShift({
        name: '',
        startTime: '',
        endTime: '',
        breakTime: '',
        breakDuration: '',
        status: 'active'
      });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Editar Turno' : 'Novo Turno'}
        </DialogTitle>
        <DialogDescription>
          {isEditing 
            ? 'Edite os dados do turno' 
            : 'Adicione um novo turno'
          }
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="shift-type">Tipo de Turno</Label>
          <Select 
            value={localShift.name}
            onValueChange={handleShiftTypeChange}
            disabled={isLoading || isSubmitting || (isEditing && initialShiftName.current !== '')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hayaban">Hayaban</SelectItem>
              <SelectItem value="osoban">Osoban</SelectItem>
              <SelectItem value="hirokin">Hirokin</SelectItem>
            </SelectContent>
          </Select>
          {isEditing && (
            <p className="text-xs text-muted-foreground mt-1">
              O tipo de turno não pode ser alterado. Crie um novo turno se necessário.
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="startTime">Horário de Início</Label>
          <Input
            id="startTime"
            type="time"
            value={localShift.startTime || ''}
            onChange={handleChange}
            disabled={isLoading || isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Horário de Término</Label>
          <Input
            id="endTime"
            type="time"
            value={localShift.endTime || ''}
            onChange={handleChange}
            disabled={isLoading || isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="breakTime">Horário do Intervalo</Label>
          <Input
            id="breakTime"
            type="time"
            value={localShift.breakTime || ''}
            onChange={handleChange}
            disabled={isLoading || isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="breakDuration">Duração do Intervalo</Label>
          <Input
            id="breakDuration"
            value={localShift.breakDuration || ''}
            onChange={handleChange}
            disabled={isLoading || isSubmitting}
          />
        </div>
        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={isLoading || isSubmitting}
        >
          {isLoading || isSubmitting
            ? (isEditing ? 'Salvando...' : 'Adicionando...') 
            : (isEditing ? 'Salvar Alterações' : 'Adicionar Turno')
          }
        </Button>
      </div>
    </DialogContent>
  );
};

export default ShiftModal;
