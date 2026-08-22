export interface ICategoryProps {
  id: number;
  name: string;
  sortOrder: number;
  colorCode: string;
  isActive: boolean;
  productCount?: number;
}

export class Category {
  public readonly id: number;
  public readonly name: string;
  public readonly sortOrder: number;
  public readonly colorCode: string;
  public readonly isActive: boolean;
  public readonly productCount: number;

  public static create(props: Partial<ICategoryProps> & { name: string }): Category {
    return new Category({
      id: props.id ?? 0,
      name: props.name,
      sortOrder: props.sortOrder ?? 0,
      colorCode: props.colorCode || "#3B82F6",
      isActive: props.isActive !== false,
      productCount: props.productCount ?? 0,
    });
  }

  constructor(props: ICategoryProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("Kategori adı boş bırakılamaz.");
    }
    this.id = props.id;
    this.name = props.name.trim();
    this.sortOrder = props.sortOrder ?? 0;
    this.colorCode = props.colorCode || "#3B82F6";
    this.isActive = props.isActive !== false;
    this.productCount = props.productCount ?? 0;
  }
}
