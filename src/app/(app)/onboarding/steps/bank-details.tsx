
'use client';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const bankDetailsSchema = z.object({
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  accountNumber: z.string().min(9, 'A valid account number is required'),
  ifscCode: z.string().length(11, 'IFSC code must be 11 characters'),
  upiId: z.string().optional(),
});

export function BankDetailsStep() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
        <FormField
            control={control}
            name="accountHolderName"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Account Holder Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={control}
            name="accountNumber"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Bank Account Number</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
         <FormField
            control={control}
            name="ifscCode"
            render={({ field }) => (
            <FormItem>
                <FormLabel>IFSC Code</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
         <FormField
            control={control}
            name="upiId"
            render={({ field }) => (
            <FormItem>
                <FormLabel>UPI ID (Optional)</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
    </div>
  );
}
