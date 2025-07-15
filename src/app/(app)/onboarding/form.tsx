
'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Loader2, PartyPopper } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import type { UserProfile } from '@/lib/types';
import { PersonalDetailsStep, personalDetailsSchema } from './steps/personal-details';
import { AddressStep, addressSchema } from './steps/address';
import { EmergencyContactStep, emergencyContactSchema } from './steps/emergency-contact';
import { BankDetailsStep, bankDetailsSchema } from './steps/bank-details';
import { DocumentUploadStep, documentUploadSchema } from './steps/document-upload';

const steps = [
  { id: 'Personal Details', component: PersonalDetailsStep, schema: personalDetailsSchema },
  { id: 'Address', component: AddressStep, schema: addressSchema },
  { id: 'Emergency Contact', component: EmergencyContactStep, schema: emergencyContactSchema },
  { id: 'Bank Details', component: BankDetailsStep, schema: bankDetailsSchema },
  { id: 'Document Upload', component: DocumentUploadStep, schema: documentUploadSchema },
];

const combinedSchema = personalDetailsSchema
  .merge(addressSchema)
  .merge(emergencyContactSchema)
  .merge(bankDetailsSchema)
  .merge(documentUploadSchema);

type OnboardingFormData = z.infer<typeof combinedSchema>;

export function OnboardingForm({ user }: { user: UserProfile }) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(steps[currentStep].schema),
    mode: 'onChange',
  });

  const { trigger, handleSubmit, formState: { errors } } = methods;

  const nextStep = async () => {
    const isValid = await trigger();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    try {
        // Here you would typically save all the data to your database
        // For simplicity, we'll just update the user's profile_setup_complete flag
        console.log("Onboarding data submitted:", data);
        
        // Finalize profile
        const { error } = await supabase
            .from('users')
            .update({ profile_setup_complete: true, phone: data.phone })
            .eq('id', user.id);

        if (error) throw error;
        
        toast({ title: 'Onboarding Complete!', description: 'Welcome aboard! You will now be redirected.' });
        router.refresh(); // This will re-trigger middleware to redirect to dashboard
    } catch (error: any) {
        toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
        setIsSubmitting(false);
    }
  };
  
  const StepComponent = steps[currentStep].component;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding - Step {currentStep + 1} of {steps.length}</CardTitle>
        <CardDescription>{steps[currentStep].id}</CardDescription>
        <Progress value={((currentStep + 1) / steps.length) * 100} className="mt-2" />
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <StepComponent user={user} />
              </motion.div>
            </AnimatePresence>
            
            <div className="mt-8 flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                <ArrowLeft className="mr-2" /> Previous
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <PartyPopper className="mr-2" />}
                  Finish Onboarding
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
