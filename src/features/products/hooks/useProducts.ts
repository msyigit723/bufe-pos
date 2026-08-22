import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductService } from "../../../application/services/ProductService";
import { CATEGORIES_QUERY_KEY } from "./useCategories";

export const PRODUCTS_QUERY_KEY = ["products"] as const;

export interface IProductFilter {
  search?: string;
  categoryId?: number;
  isActive?: boolean;
}

export function useProducts(filter?: IProductFilter) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, filter],
    queryFn: () => ProductService.listProducts(filter),
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, "detail", id],
    queryFn: () => (id ? ProductService.getProductById(id) : null),
    enabled: id !== null && id > 0,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      code?: string;
      name: string;
      categoryId?: number | null;
      unitName?: string;
      costPriceKurus: number;
      salePriceKurus: number;
      vatRate?: number;
      minStockLevel?: number;
      trackSKT?: boolean;
      isActive?: boolean;
      initialBarcode?: string;
    }) => ProductService.createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: number;
      code: string;
      name: string;
      categoryId?: number | null;
      unitName: string;
      costPriceKurus: number;
      salePriceKurus: number;
      vatRate: number;
      minStockLevel: number;
      trackSKT: boolean;
      isActive: boolean;
    }) => ProductService.updateProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

export function useSetProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      ProductService.setProductActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ProductService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

export function useAddBarcode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      barcode,
      isPrimary,
    }: {
      productId: number;
      barcode: string;
      isPrimary: boolean;
    }) => ProductService.addProductBarcode(productId, barcode, isPrimary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useRemoveBarcode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (barcodeId: number) => ProductService.removeProductBarcode(barcodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

export function useSetPrimaryBarcode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      barcodeId,
    }: {
      productId: number;
      barcodeId: number;
    }) => ProductService.setPrimaryBarcode(productId, barcodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}
