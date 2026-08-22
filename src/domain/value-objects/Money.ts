/**
 * Money Value Object
 * Ensures zero floating-point rounding errors by storing amounts as Kurus (Integer).
 * 100.50 TL -> 10050 Kurus
 */
export class Money {
  private readonly kurusAmount: number;

  private constructor(kurusAmount: number) {
    if (!Number.isInteger(kurusAmount)) {
      throw new Error(`Money kurus amount must be an integer, received: ${kurusAmount}`);
    }
    this.kurusAmount = kurusAmount;
  }

  public static fromKurus(kurus: number): Money {
    return new Money(Math.round(kurus));
  }

  public static fromLira(lira: number): Money {
    return new Money(Math.round(lira * 100));
  }

  public getKurus(): number {
    return this.kurusAmount;
  }

  public toKurus(): number {
    return this.kurusAmount;
  }

  public getLira(): number {
    return this.kurusAmount / 100;
  }

  public toLira(): number {
    return this.kurusAmount / 100;
  }

  public add(other: Money): Money {
    return new Money(this.kurusAmount + other.kurusAmount);
  }

  public subtract(other: Money): Money {
    return new Money(this.kurusAmount - other.kurusAmount);
  }

  public multiply(factor: number): Money {
    return new Money(Math.round(this.kurusAmount * factor));
  }

  public formatTL(): string {
    const lira = this.getLira();
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(lira);
  }

  public format(): string {
    return this.formatTL();
  }
}
