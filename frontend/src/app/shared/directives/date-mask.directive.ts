import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appDateMask]',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DateMaskDirective),
    multi: true,
  }],
})
export class DateMaskDirective implements ControlValueAccessor {
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(private elementRef: ElementRef<HTMLInputElement>) {}

  writeValue(value: string | Date | null | undefined): void {
    this.elementRef.nativeElement.value = this.toDisplayValue(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.elementRef.nativeElement.disabled = disabled;
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 8);
    const formatted = this.formatDigits(digits);
    input.value = formatted;
    this.onChange(digits.length === 8 ? this.toIso(formatted) : '');
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private formatDigits(digits: string): string {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  private toIso(value: string): string {
    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  }

  private toDisplayValue(value: string | Date | null | undefined): string {
    if (!value) return '';
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${value.getFullYear()}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
  }
}
