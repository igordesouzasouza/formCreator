"use client";

import { useState } from "react";
import { useForm, Controller, UseFormReturn } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Plus, X } from "lucide-react";

type FormData = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  photo: File | null;
  sizes: Record<string, Record<string, string>>;
};

const categories = [
  "Vestidos",
  "Camisetes",
  "Blusas",
  "Saias",
  "Bermudas",
  "Blazer",
  "Calça",
  "Colete",
];
const sizes = ["PP", "P", "M", "G", "GG"];
const measures: Record<string, string[]> = {
  Vestidos: ["busto", "cintura", "quadril", "comprimento", "ombro"],
  Camisetes: ["busto", "comprimento", "ombro", "manga"],
  Blusas: ["busto", "comprimento", "ombro", "manga"],
  Saias: ["cintura", "quadril", "comprimento"],
  Bermudas: ["cintura", "quadril", "comprimento", "abertura"],
  Blazer: ["busto", "cintura", "comprimento", "ombro", "manga"],
  Calça: ["cintura", "quadril", "comprimento", "entrepernas", "abertura"],
  Colete: ["busto", "cintura", "comprimento", "ombro"],
};

export default function ProductForm() {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      photo: null,
      sizes: {},
    },
  });

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openSizeDialog, setOpenSizeDialog] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [extraMeasures, setExtraMeasures] = useState<Record<string, string[]>>(
    {}
  );

  const category = watch("category");
  const currentMeasures = category ? measures[category] || [] : [];

  const onSubmit = async (data: FormData) => {
    setMessage(null);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", data.price.toString());
    formData.append("stock", data.stock.toString());
    formData.append("category", data.category);
    if (data.photo) formData.append("photo", data.photo);

    Object.entries(data.sizes).forEach(([size, measures]) => {
      Object.entries(measures).forEach(([measure, value]) => {
        formData.append(`sizes[${size}_${measure}]`, value);
      });
    });

    try {
      const res = await fetch("/api/products/create", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Falha ao criar produto");
      setMessage(`Produto criado com sucesso! ID: ${result.product.id}`);
      reset();
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setMessage("Erro: Requisição excedeu o tempo limite de 30 segundos.");
      } else {
        setMessage(`Erro: ${(error as Error).message}`);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const addExtraMeasure = (measure: string) => {
    if (!measure.trim() || !selectedSize) return;
    setExtraMeasures((prev) => {
      if (prev[selectedSize!]?.includes(measure.trim())) return prev;
      return {
        ...prev,
        [selectedSize]: [...(prev[selectedSize] || []), measure.trim()],
      };
    });
    setOpenSizeDialog(false);
  };

  const removeMeasure = (size: string, measure: string) => {
    setExtraMeasures((prev) => ({
      ...prev,
      [size]: (prev[size] || []).filter((m) => m !== measure),
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Criador de Produto
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-4"
      >
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nome
          </label>
          <Controller
            name="name"
            control={control}
            rules={{ required: "Nome é obrigatório" }}
            render={({ field }) => (
              <Input {...field} placeholder="Nome do produto" />
            )}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Descrição
          </label>
          <Controller
            name="description"
            control={control}
            rules={{ required: "Descrição é obrigatória" }}
            render={({ field }) => <Input {...field} placeholder="Descrição" />}
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Preço (reais)
          </label>
          <Controller
            name="price"
            control={control}
            rules={{
              required: "Preço é obrigatório",
              min: 1,
            }}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="Preço em reais"
              />
            )}
          />
          {errors.price && (
            <p className="text-red-500 text-sm">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Estoque
          </label>
          <Controller
            name="stock"
            control={control}
            rules={{ required: "Estoque é obrigatório", min: 0 }}
            render={({ field }) => (
              <Input {...field} type="number" placeholder="Estoque" />
            )}
          />
          {errors.stock && (
            <p className="text-red-500 text-sm">{errors.stock.message}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Categoria
          </label>
          <Controller
            name="category"
            control={control}
            rules={{ required: "Categoria é obrigatória" }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full border rounded p-2">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-red-500 text-sm">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Foto
          </label>
          <Controller
            name="photo"
            control={control}
            render={({ field: { onChange } }) => (
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size > 5 * 1024 * 1024) {
                    setMessage(
                      "Erro: O tamanho da foto deve ser inferior a 5MB."
                    );
                    return;
                  }
                  onChange(file || null);
                }}
              />
            )}
          />
        </div>

        {currentMeasures.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-gray-700 font-semibold">Medidas por Tamanho</h2>
            {sizes.map((size) => (
              <div key={size} className="border rounded p-2">
                <h3 className="font-medium">{size}</h3>
                <div className="space-y-2 mt-2">
                  {[...currentMeasures, ...(extraMeasures[size] || [])].map(
                    (measure) => (
                      <div key={measure} className="flex items-center gap-2">
                        <Controller
                          name={`sizes.${size}.${measure}` as const}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder={`Informe ${measure}`}
                            />
                          )}
                        />
                        {/* teste deles */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeMeasure(size, measure)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedSize(size);
                      setOpenSizeDialog(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Medida
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-sm text-gray-700">
          Clique abaixo para criar o produto!
        </p>
        <Button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? "Criando..." : "Criar Produto"}
        </Button>
      </form>

      {message && (
        <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
      )}

      <Dialog open={openSizeDialog} onOpenChange={setOpenSizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Medida para {selectedSize}</DialogTitle>
          </DialogHeader>
          <Input placeholder="Nome da medida" id="newMeasureInput" />
          <DialogFooter>
            <Button
              onClick={() => {
                // Em vez disso, obtenha o valor do input diretamente quando o botão for clicado
                const inputElement = document.getElementById(
                  "newMeasureInput"
                ) as HTMLInputElement;
                const newMeasure = inputElement?.value || "";
                addExtraMeasure(newMeasure);
                // Limpe o input após adicionar
                if (inputElement) inputElement.value = "";
              }}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
