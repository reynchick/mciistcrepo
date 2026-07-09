import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import ModalHeader from '@/components/shared/modal-header';

export default function DeleteUser() {
    const page = usePage();
    const [open, setOpen] = useState(page.url.includes('delete_account=1'));

    useEffect(() => {
        setOpen(page.url.includes('delete_account=1'));
    }, [page.url]);

    return (
        <div className="space-y-6">
            <HeadingSmall title="Delete account" description="Delete your account and all of its resources" />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">Please proceed with caution, this cannot be undone.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive">Delete account</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <ModalHeader
                            title="Are you sure you want to delete your account?"
                            variant="danger"
                            icon={AlertTriangle}
                        />
                        <DialogDescription>
                            Once your account is deleted, all of its resources and data will also be permanently deleted. Because this app uses
                            Google SSO only, you will be asked to sign in with Google again if your session is not recent enough.
                        </DialogDescription>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            resetOnSuccess
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing }) => (
                                <>
                                    <div className="rounded-lg border border-muted bg-muted/50 p-4 text-sm text-muted-foreground">
                                        If your Google session is stale, this action will first send you back through Google sign-in, then reopen this
                                        dialog so you can confirm the deletion.
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <DialogClose asChild>
                                            <Button variant="outline" onClick={() => resetAndClearErrors()}>
                                                Cancel
                                            </Button>
                                        </DialogClose>

                                        <Button variant="destructive" disabled={processing} asChild>
                                            <button type="submit">{processing ? 'Deleting…' : 'Delete account'}</button>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
