import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function ApplicantPortalPage({ params }: { params: { id: string } }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Registration Complete!</CardTitle>
                    <CardDescription>
                        Your applicant profile has been successfully created. Our HR team will be in touch shortly.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Your Applicant ID is: <span className="font-mono">{params.id}</span></p>
                    <p className="text-sm text-muted-foreground mt-2">You can close this window.</p>
                    <Button asChild className="mt-6">
                        <Link href="/">Return to Homepage</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
