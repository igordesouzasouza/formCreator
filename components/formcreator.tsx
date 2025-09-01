"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "./ui/dialog";
import { X, Plus } from "lucide-react";

const categorias = [
  "Vestidos",
  "Camisetes",
  "Blusas",
  "Saias",
  "Bermudas",
  "Blazer",
  "Calça",
  "Colete",
];

const medidasPorCategoria: Record<string, string[]> = {
  Vestidos: ["busto", "cintura", "quadril", "comprimento total", "ombro a ombro"],
  Camisetes: ["busto", "comprimento", "ombro a ombro", "manga"],
  Blusas: ["busto", "comprimento", "ombro a ombro", "manga"],
  Saias: ["cintura", "quadril", "comprimento"],
  Bermudas: ["cintura", "quadril", "comprimento", "abertura da perna"],
  Blazer: ["busto", "cintura", "comprimento total", "ombro a ombro", "manga"],
  Calça: ["cintura", "quadril", "comprimento total", "entrepernas", "abertura da perna"],
  Colete: ["busto", "cintura", "comprimento total", "ombro a ombro"],
};

const tamanhos = ["PP", "P", "M", "G", "GG"];

type FormType = {
  name: string;
  description: string;
  price: string;
  estoque: string;
  categoria: string;
  foto: File | null;
  medidas: Record<string, Record<string, string>>;
};

export default function FormCreator() {
  const [form, setForm] = useState<FormType>({
    name: "",
    description: "",
    price: "",
    estoque: "",
    categoria: "",
    foto: null,
    medidas: {},
  });

  const [msg, setMsg] = useState("");
  const [tamanhoAberto, setTamanhoAberto] = useState<string | null>(null);
  const [medidasExtras, setMedidasExtras] = useState<Record<string, string[]>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaMedida, setNovaMedida] = useState("");
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;

    if (name === "foto") {
      setForm({ ...form, foto: files ? files[0] : null });
    } else if (name.startsWith("medida_")) {
      const [_, tamanho, medida] = name.split("_");
      setForm((prev) => ({
        ...prev,
        medidas: {
          ...prev.medidas,
          [tamanho]: { ...prev.medidas[tamanho], [medida]: value },
        },
      }));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const toggleTamanho = (tamanho: string) => {
    setTamanhoAberto(tamanhoAberto === tamanho ? null : tamanho);
  };

  const addMedida = () => {
    if (!novaMedida.trim() || !tamanhoSelecionado) return;
    setMedidasExtras((prev) => ({
      ...prev,
      [tamanhoSelecionado]: [...(prev[tamanhoSelecionado] || []), novaMedida.trim()],
    }));
    setNovaMedida("");
    setDialogOpen(false);
  };

  const removeMedida = (tamanho: string, medida: string) => {
    setMedidasExtras((prev) => ({
      ...prev,
      [tamanho]: (prev[tamanho] || []).filter((m) => m !== medida),
    }));

    setForm((prev) => {
      const novo = { ...prev.medidas };
      delete novo[tamanho]?.[medida];
      return { ...prev, medidas: novo };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("estoque", form.estoque);
    formData.append("categoria", form.categoria);
    if (form.foto) formData.append("foto", form.foto);

    Object.entries(form.medidas).forEach(([tamanho, medidas]) => {
      Object.entries(medidas).forEach(([medida, valor]) => {
        formData.append(`medidas[${tamanho}_${medida}]`, valor);
      });
    });

    const res = await fetch("/api/products/create", {
      method: "POST",
      body: formData,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      setMsg("Erro inesperado no servidor");
      return;
    }

    if (!res.ok) {
      setMsg(data?.error || "Erro ao criar produto");
      return;
    }

    setMsg("Produto criado com sucesso!");
    setForm({
      name: "",
      description: "",
      price: "",
      estoque: "",
      categoria: "",
      foto: null,
      medidas: {},
    });
    setTamanhoAberto(null);
    setMedidasExtras({});
  };

  const medidasAtuais = medidasPorCategoria[form.categoria] || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Criador de Produto</h1>

      <div className="w-full flex justify-center px-4">
        <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
          {/* Nome, descrição, preço, estoque, categoria */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Nome do Produto</label>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="Nome do produto" required />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Descrição do Produto</label>
            <Input name="description" value={form.description} onChange={handleChange} placeholder="Descrição" required />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Preço (centavos)</label>
            <Input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Preço em centavos" required />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Estoque</label>
            <Input type="number" name="estoque" value={form.estoque} onChange={handleChange} placeholder="Estoque" required />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Categoria</label>
            <select name="categoria" value={form.categoria} onChange={handleChange} className="w-full border rounded p-2" required>
              <option value="">Selecione</option>
              {categorias.map((cat) => (
                <option value={cat} key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Foto */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Foto do Produto</label>
            <input type="file" name="foto" accept="image/*" onChange={handleChange} className="w-full border rounded p-2" required />
          </div>

          {/* Medidas por tamanho */}
          {form.categoria && medidasAtuais.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-gray-700 font-semibold">Medidas por Tamanho</h2>
              {tamanhos.map((tamanho) => (
                <div key={tamanho} className="border rounded p-2">
                  <Button type="button" className="w-full mb-2 bg-white text-black hover:bg-white" onClick={() => toggleTamanho(tamanho)}>
                    {tamanho} {tamanhoAberto === tamanho ? "" : ""}
                  </Button>
                  {tamanhoAberto === tamanho && (
                    <div className="space-y-2">
                      {/* medidas fixas */}
                      {medidasAtuais.map((medida) => (
                        <div key={medida} className="flex items-center gap-2">
                          <Input
                            name={`medida_${tamanho}_${medida}`}
                            placeholder={`Informe ${medida}`}
                            value={form.medidas[tamanho]?.[medida] || ""}
                            onChange={handleChange}
                            required
                          />
                          {/* <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeMedida(tamanho, medida)}
                          >
                            <X className="w-4 h-4" />
                          </Button> */}
                        </div>
                      ))}

                      {/* medidas extras */}
                      {(medidasExtras[tamanho] || []).map((medida) => (
                        <div key={medida} className="flex items-center gap-2">
                          <Input
                            name={`medida_${tamanho}_${medida}`}
                            placeholder={`Informe ${medida}`}
                            value={form.medidas[tamanho]?.[medida] || ""}
                            onChange={handleChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeMedida(tamanho, medida)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setTamanhoSelecionado(tamanho)}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Adicionar medida
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Nova medida para {tamanho}</DialogTitle>
                          </DialogHeader>
                          <Input
                            value={novaMedida}
                            onChange={(e) => setNovaMedida(e.target.value)}
                            placeholder="Nome da medida"
                          />
                          <DialogFooter>
                            <Button type="button" onClick={addMedida}>
                              Adicionar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-center text-sm text-gray-700">
            Clique no botão abaixo para criar o produto e aguarde a resposta!
          </p>

          <Button type="submit" className="mb-20 bg-black text-white font-bold py-2 px-4 rounded-lg w-full">
            Criar Produto
          </Button>
        </form>
      </div>

      {msg && <p className="mt-4 mb-20 text-center text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
