export type BarcodeType = "EAN-13" | "EAN-8" | "CODE-128" | "OTHER";

export class Barcode {
  private readonly value: string;

  constructor(barcodeString: string) {
    const cleaned = barcodeString ? barcodeString.trim() : "";
    if (!cleaned) {
      throw new Error("Barkod boş bırakılamaz.");
    }
    if (cleaned.length < 3 || cleaned.length > 50) {
      throw new Error("Barkod 3 ile 50 karakter arasında olmalıdır.");
    }
    // Disallow forbidden control characters while allowing standard retail alphanumeric / hyphen / slash barcodes
    if (/[\r\n\t]/.test(cleaned)) {
      throw new Error("Barkod geçersiz kontrol karakterleri içeremez.");
    }
    this.value = cleaned;
  }

  public getValue(): string {
    return this.value;
  }

  public getType(): BarcodeType {
    if (/^\d{13}$/.test(this.value)) {
      return "EAN-13";
    }
    if (/^\d{8}$/.test(this.value)) {
      return "EAN-8";
    }
    if (/^[A-Z0-9\-_./]+$/i.test(this.value)) {
      return "CODE-128";
    }
    return "OTHER";
  }

  public isValidEanChecksum(): boolean {
    if (/^\d{13}$/.test(this.value)) {
      const checkDigit = Barcode.calculateEan13CheckDigit(this.value.substring(0, 12));
      return Number(this.value.charAt(12)) === checkDigit;
    }
    if (/^\d{8}$/.test(this.value)) {
      const checkDigit = Barcode.calculateEan8CheckDigit(this.value.substring(0, 7));
      return Number(this.value.charAt(7)) === checkDigit;
    }
    return true;
  }

  public static calculateEan13CheckDigit(first12Digits: string): number {
    if (!/^\d{12}$/.test(first12Digits)) {
      throw new Error("EAN-13 kontrol basamağı hesabı için 12 hane rakam gereklidir.");
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(first12Digits[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const rem = sum % 10;
    return rem === 0 ? 0 : 10 - rem;
  }

  public static calculateEan8CheckDigit(first7Digits: string): number {
    if (!/^\d{7}$/.test(first7Digits)) {
      throw new Error("EAN-8 kontrol basamağı hesabı için 7 hane rakam gereklidir.");
    }
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(first7Digits[i], 10);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    const rem = sum % 10;
    return rem === 0 ? 0 : 10 - rem;
  }

  public equals(other: Barcode | string): boolean {
    const otherVal = typeof other === "string" ? other.trim() : other.getValue();
    return this.value === otherVal;
  }

  public toString(): string {
    return this.value;
  }
}
