import { router } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type RoleOption = {
    id: number;
    name: string;
};

type SwitchRoleCardProps = {
    roles?: RoleOption[];
    activeRole?: string;
};

const ROLE_LABELS: Record<string, string> = {
    Administrator: 'Login as Admin',
    'MCIIS Staff': 'Login as MCIIS Staff',
    Faculty: 'Login as Faculty',
    Student: 'Login as Student',
};

export default function SwitchRoleCard({ roles = [], activeRole }: SwitchRoleCardProps) {
    const availableRoles = [...roles]
        .filter((role) => Boolean(role?.name))
        .sort((left, right) => left.name.localeCompare(right.name));

    if (availableRoles.length <= 1) {
        return null;
    }

    return (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Switch Role</h3>
                    <p className="text-sm text-muted-foreground">
                        Choose the role you want to use for this session.
                    </p>
                </div>
                <Badge variant="outline">Active: {activeRole ?? 'Unknown'}</Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                {availableRoles.map((role) => {
                    const normalizedName = role.name.trim();
                    const isActive = normalizedName.toLowerCase() === (activeRole ?? '').toLowerCase();
                    const label = ROLE_LABELS[normalizedName] ?? `Login as ${normalizedName}`;

                    return (
                        <Button
                            key={role.id}
                            type="button"
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => router.post('/settings/profile/switch-role', { role: normalizedName }, { preserveScroll: true })}
                            disabled={isActive}
                        >
                            {label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
