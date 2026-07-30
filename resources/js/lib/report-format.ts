import type { Faculty, Researcher } from '@/types/reports';

export function formatName(person?: Faculty | Researcher): string {
	if (!person) return 'N/A';
	const middle = person.middle_name ? ` ${person.middle_name.charAt(0)}.` : '';
	return `${person.first_name}${middle} ${person.last_name}`;
}

export function formatMonthYear(month?: number, year?: number): string {
	if (!year) return 'N/A';
	if (!month) return year.toString();
	const monthNames = [
		'', 'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December',
	];
	return `${monthNames[month]} ${year}`;
}

export function formatTagList(items?: any[], field: string = 'name'): string {
	if (!items || items.length === 0) return 'N/A';
	return items.map((item) => item[field]).join(', ');
}