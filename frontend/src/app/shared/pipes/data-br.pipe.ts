import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dataBr', standalone: true })
export class DataBrPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    if (value instanceof Date) {
      return `${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
  }
}
