
'use client';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const emergencyContactSchema = z.object({
  emergencyContactName: z.string().min(2, 'Contact name is required'),
  emergencyContactPhone: z.string().min(10, 'A valid phone number is required'),
  emergencyContactRelationship: z.string().min(2, 'Relationship is required'),
});

export function EmergencyContactStep() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
        <FormField
            control={control}
            name="emergencyContactName"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Emergency Contact Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={control}
            name="emergencyContactPhone"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Emergency Contact Phone</FormLabel>
                <FormControl><Input type="tel" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
         <FormField
            control={control}
            name="emergencyContactRelationship"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Relationship</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
    </div>
  );
}
