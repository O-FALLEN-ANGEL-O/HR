
'use client';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';
import { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';

export const documentUploadSchema = z.object({
  profilePhoto: z.any().refine(file => file?.length == 1, 'Profile photo is required.'),
  panCard: z.any().refine(file => file?.length == 1, 'PAN card is required.'),
  aadhaarCard: z.any().refine(file => file?.length == 1, 'Aadhaar card is required.'),
  resume: z.any().refine(file => file?.length == 1, 'Resume is required.'),
});

type UploadableDocument = 'profilePhoto' | 'panCard' | 'aadhaarCard' | 'resume';

export function DocumentUploadStep({ user }: { user: UserProfile }) {
  const { control, setValue } = useFormContext();
  const [uploading, setUploading] = React.useState<Partial<Record<UploadableDocument, boolean>>>({});
  const [uploaded, setUploaded] = React.useState<Partial<Record<UploadableDocument, boolean>>>({});
  const supabase = createClient();
  const { toast } = useToast();

  const handleFileUpload = async (file: File, docType: UploadableDocument, fieldName: 'profilePhoto' | 'panCard' | 'aadhaarCard' | 'resume') => {
    if (!file) return;

    setUploading(prev => ({ ...prev, [docType]: true }));
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${docType}_${user.id}.${fileExt}`;
    const bucket = docType === 'profilePhoto' ? 'avatars' : 'employee_documents';

    const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
        upsert: true,
    });
    
    setUploading(prev => ({ ...prev, [docType]: false }));

    if (error) {
        toast({ title: 'Upload Failed', description: error.message, variant: 'destructive'});
    } else {
        setUploaded(prev => ({...prev, [docType]: true}));
        setValue(fieldName, [file], { shouldValidate: true });
        toast({ title: 'Upload Successful', description: `${file.name} has been uploaded.` });
        
        // If it's the profile photo, update the user's avatar_url
        if (docType === 'profilePhoto') {
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
            await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
        }
    }
  };


  return (
    <div className="space-y-4">
      <FileUploader id="profilePhoto" label="Profile Photo" onFileSelect={(file) => handleFileUpload(file, 'profilePhoto', 'profilePhoto')} uploading={uploading.profilePhoto} uploaded={uploaded.profilePhoto} control={control} />
      <FileUploader id="panCard" label="PAN Card" onFileSelect={(file) => handleFileUpload(file, 'panCard', 'panCard')} uploading={uploading.panCard} uploaded={uploaded.panCard} control={control} />
      <FileUploader id="aadhaarCard" label="Aadhaar Card" onFileSelect={(file) => handleFileUpload(file, 'aadhaarCard', 'aadhaarCard')} uploading={uploading.aadhaarCard} uploaded={uploaded.aadhaarCard} control={control} />
      <FileUploader id="resume" label="Resume/CV" onFileSelect={(file) => handleFileUpload(file, 'resume', 'resume')} uploading={uploading.resume} uploaded={uploaded.resume} control={control} />
    </div>
  );
}


function FileUploader({ id, label, onFileSelect, uploading, uploaded, control }: { id: string, label: string, onFileSelect: (file: File) => void, uploading?: boolean, uploaded?: boolean, control: any }) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    return (
        <FormField
            control={control}
            name={id}
            render={({ field: { onChange, ...fieldProps } }) => (
                <FormItem>
                <FormLabel>{label}</FormLabel>
                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <UploadCloud className="mr-2"/>
                        {uploading ? 'Uploading...' : 'Choose File'}
                    </Button>
                    <FormControl>
                        <Input
                        {...fieldProps}
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                            if (event.target.files?.[0]) {
                                onFileSelect(event.target.files[0]);
                                onChange(event.target.files);
                            }
                        }}
                        />
                    </FormControl>
                    {uploaded && <CheckCircle className="text-green-500" />}
                    {uploading && <Loader2 className="animate-spin" />}
                </div>
                <FormMessage />
                </FormItem>
            )}
        />
    )
}
