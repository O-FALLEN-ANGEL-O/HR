
'use client';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import * as React from 'react';

export const addressSchema = z.object({
  permanentAddress: z.string().min(10, 'Permanent address is required'),
  currentAddress: z.string().min(10, 'Current address is required'),
  isSameAddress: z.boolean().default(false),
});

export function AddressStep() {
  const { control, setValue, watch } = useFormContext();
  const permanentAddress = watch('permanentAddress');
  const isSameAddress = watch('isSameAddress');

  React.useEffect(() => {
    if (isSameAddress) {
      setValue('currentAddress', permanentAddress, { shouldValidate: true });
    }
  }, [isSameAddress, permanentAddress, setValue]);

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="permanentAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Permanent Address</FormLabel>
            <FormControl><Textarea {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
       <FormField
        control={control}
        name="isSameAddress"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Current address is the same as permanent address
              </FormLabel>
            </div>
          </FormItem>
        )}
      />
       <FormField
        control={control}
        name="currentAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current Address</FormLabel>
            <FormControl><Textarea {...field} disabled={isSameAddress} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
