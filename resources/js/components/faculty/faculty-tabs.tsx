interface Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function FacultyTabs({ activeTab, onTabChange }: Props) {
    const tabs = [
        { id: 'education', label: 'Education' },
        { id: 'specialization', label: 'Specialization' },
        { id: 'research_interest', label: 'Research Interest' },
    ];

    return (
        <div className="flex border-b border-gray-200 dark:border-gray-600">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                        relative px-4 py-2 text-xs font-medium uppercase tracking-wider cursor-pointer
                        ${activeTab === tab.id
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }
                    `}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-400 dark:bg-blue-400" />
                    )}
                </button>
            ))}
        </div>
    );
}