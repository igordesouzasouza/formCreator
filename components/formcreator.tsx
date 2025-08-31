"use client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";

const categorias = ["Vestidos", "Alfaiataria", "Camisetas", "Decotes"];

const medidasPorCategoria: Record<string, string[]> = {
  Vestidos: ["busto", "torax", "comprimento"],
  Camisetas: ["busto", "comprimento"],
  Alfaiataria: ["busto", "comprimento"],
  Decotes: ["busto", "comprimento"],
};

type FormType = {
  name: string;
  description: string;
  price: string;
  estoque: string;
  categoria: string;
  foto: File | null;
  medidas: Record<string, string>; // <- novo
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "foto") {
      setForm({ ...form, foto: files ? files[0] : null });
    } else if (name.startsWith("medida_")) {
      const medidaNome = name.replace("medida_", "");
      setForm({
        ...form,
        medidas: { ...form.medidas, [medidaNome]: value },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
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

    // adiciona as medidas como metadados
    Object.entries(form.medidas).forEach(([key, value]) => {
      formData.append(`medidas[${key}]`, value);
    });

    const res = await fetch("/api/products/create", {
      method: "POST",
      body: formData,
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
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
  };

  const medidasAtuais = medidasPorCategoria[form.categoria] || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Criador de Produto</h1>

      <div className="w-full flex justify-center px-4">
        <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Nome do Produto
            </label>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nome do produto"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Descrição do Produto
            </label>
            <Input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descrição"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
              Preço do Produto (centavos)
            </label>
            <Input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              placeholder="Preço em centavos"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="estoque">
              Estoque
            </label>
            <Input
              name="estoque"
              type="number"
              value={form.estoque}
              onChange={handleChange}
              placeholder="Estoque"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoria">
              Categoria
            </label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Selecione</option>
              {categorias.map((cat) => (
                <option value={cat} key={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Inputs dinâmicos para medidas */}
          {medidasAtuais.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-gray-700 font-semibold">Medidas</h2>
              {medidasAtuais.map((medida) => (
                <div key={medida}>
                  <label className="block text-gray-700 text-sm mb-1" htmlFor={`medida_${medida}`}>
                    {medida.charAt(0).toUpperCase() + medida.slice(1)}
                  </label>
                  <Input
                    name={`medida_${medida}`}
                    type="text"
                    value={form.medidas[medida] || ""}
                    onChange={handleChange}
                    placeholder={`Informe ${medida}`}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="foto">
              Foto do Produto
            </label>
            <input
              name="foto"
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <p className="text-center text-sm text-gray-700">
            De APENAS UM clique no botão abaixo para criar o produto e aguarde a resposta!
          </p>
          <Button
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg w-full"
            type="submit"
          >
            Criar Produto
          </Button>
        </form>
      </div>

      {msg && <p className="mt-4 text-center text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
